// @vitest-environment node
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { mergeCatalogSettings } from './merge-catalog-settings'
import { fixedMergeCatalogSettings } from './fixed-merge-catalog-settings'
import { estimateDelivery } from './delivery-estimate'
import { CONSTRUCTOR_PAYLOAD, DEFAULT_SETTINGS, PROTOTYPE_PAYLOAD } from './fixtures'

function vulnerableRun(payload: string) {
  // Execute the real functions in a fresh realm, never pollute Vitest's prototypes.
  return runInNewContext(`
    const mergeCatalogSettings = (${mergeCatalogSettings.toString()});
    const estimateDelivery = (${estimateDelivery.toString()});
    const input = JSON.parse(payload);
    const afterParse = Object.prototype.deliveryFee;
    const settings = mergeCatalogSettings({ view: { sort: 'name', pageSize: 20 } }, input);
    const independentObject = {};
    ({ afterParse, settings, prototypeFee: Object.prototype.deliveryFee,
       newObjectFee: independentObject.deliveryFee,
       hasOwnFee: Object.hasOwn(independentObject, 'deliveryFee'),
       estimate: estimateDelivery(independentObject), ownFee: estimateDelivery({ deliveryFee: 700 }) });
  `, { payload }, { timeout: 1000 })
}

describe('catalog settings prototype pollution', () => {
  it.each([PROTOTYPE_PAYLOAD, CONSTRUCTOR_PAYLOAD])('pollutes only at the merge step through either prototype path: %s', (payload) => {
    const result = vulnerableRun(payload)
    expect(result.afterParse).toBeUndefined()
    expect(result.prototypeFee).toBe(0)
    expect(result.newObjectFee).toBe(0)
    expect(result.hasOwnFee).toBe(false)
    expect(result.estimate).toBe(0)
    expect(result.ownFee).toBe(700)
    expect(Object.hasOwn(Object.prototype, 'deliveryFee')).toBe(false)
  })

  it('also reaches the prototype through a nested input object', () => {
    expect(vulnerableRun('{"view":{"__proto__":{"deliveryFee":0}}}').estimate).toBe(0)
  })

  it('a normal own property is not global prototype pollution', () => {
    const result = vulnerableRun('{"deliveryFee":0}')
    expect(result.settings.deliveryFee).toBe(0)
    expect(result.prototypeFee).toBeUndefined()
    expect(result.newObjectFee).toBeUndefined()
    expect(result.estimate).toBe(490)
  })

  it('imports legitimate view settings in both versions', () => {
    const target = { view: { sort: 'name', pageSize: 10 } }
    expect(fixedMergeCatalogSettings(target, JSON.parse(DEFAULT_SETTINGS))).toEqual({ view: { sort: 'price', pageSize: 20 } })
    const result = vulnerableRun(DEFAULT_SETTINGS)
    expect(result.settings).toEqual(target)
    expect(result.estimate).toBe(490)
    expect(estimateDelivery({})).toBe(490)
  })

  it.each([
    PROTOTYPE_PAYLOAD,
    CONSTRUCTOR_PAYLOAD,
    '{"view":{"sort":"price","pageSize":20,"__proto__":{"deliveryFee":0}}}',
    '{"view":{"sort":"price","pageSize":20,"constructor":{"prototype":{"deliveryFee":0}}}}',
    '{"view":{"sort":"price","pageSize":20},"deliveryFee":0}',
    '{"view":{"sort":"price","pageSize":20},"prototype":{}}',
    '{"view":{"sort":"name","pageSize":20,"extra":true}}',
    '{"view":{"sort":"other","pageSize":20}}',
    '{"view":{"sort":"price","pageSize":"20"}}',
    '{"view":{"sort":"price","pageSize":0}}',
    '{"view":{"sort":"price","pageSize":101}}',
    '{"view":{"sort":"price","pageSize":1.5}}',
    '{"view":null}', '{}', 'null', '[]', '42',
  ])('rejects unknown keys or invalid types before changing any settings: %s', (payload) => {
    const target = { view: { sort: 'name', pageSize: 10 } }
    expect(() => fixedMergeCatalogSettings(target, JSON.parse(payload))).toThrow()
    expect(target).toEqual({ view: { sort: 'name', pageSize: 10 } })
    expect(Object.hasOwn(Object.prototype, 'deliveryFee')).toBe(false)
  })

  it('copies validated fields without retaining a reference to the input', () => {
    const input = { view: { sort: 'price', pageSize: 36 } }
    const target = fixedMergeCatalogSettings({}, input)
    input.view.pageSize = 90
    expect(target).toEqual({ view: { sort: 'price', pageSize: 36 } })
  })
})
