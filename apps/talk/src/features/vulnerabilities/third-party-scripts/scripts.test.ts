import { describe, expect, it } from 'vitest'
import { createAnalyticsScript } from './create-analytics-script'
import { fixedCreateAnalyticsScript } from './fixed-create-analytics-script'
import { TRUSTED_ANALYTICS_INTEGRITY } from './integrity'

describe('our analytics integration', () => {
  it('keeps the URL and CORS mode unchanged, adding only integrity', () => {
    const src = 'http://127.0.0.1:3001/third-party/checkout-analytics.js?variant=compromised'
    const vulnerable = createAnalyticsScript(src)
    const fixed = fixedCreateAnalyticsScript(src)
    expect(vulnerable.src).toBe(src)
    expect(fixed.src).toBe(src)
    expect(vulnerable.crossOrigin).toBe('anonymous')
    expect(fixed.crossOrigin).toBe('anonymous')
    expect(vulnerable.getAttribute('integrity')).toBeNull()
    expect(fixed.integrity).toBe(TRUSTED_ANALYTICS_INTEGRITY)
  })
})
