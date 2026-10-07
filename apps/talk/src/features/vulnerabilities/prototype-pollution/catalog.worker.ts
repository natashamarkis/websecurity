import { mergeCatalogSettings } from './merge-catalog-settings'
import { fixedMergeCatalogSettings } from './fixed-merge-catalog-settings'
import { estimateDelivery } from './delivery-estimate'
import { MAX_SETTINGS_LENGTH, type PollutionResult } from './fixtures'
import type { DemoMode } from '@/shared/lib/demoMode'

function displayValue(value: unknown): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value.slice(0, 80))
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return '[объект]'
}

function checkDepth(value: unknown, depth = 0) {
  if (depth > 20) throw new Error('Слишком много уровней вложенности: максимум 20.')
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) checkDepth(child, depth + 1)
  }
}

// Каждый запуск получает новый Worker: его прототипы не общие с React или Node.js.
self.onmessage = (event: MessageEvent<{ input: string; mode: DemoMode }>) => {
  const settings = { view: { sort: 'name', pageSize: 20 } }
  let accepted = false
  let error: string | null = null
  let afterParse = 'undefined'
  try {
    if (event.data.input.length > MAX_SETTINGS_LENGTH) throw new Error('JSON слишком большой.')
    let input: unknown
    try { input = JSON.parse(event.data.input) } catch { throw new Error('Некорректный JSON.') }
    afterParse = displayValue((Object.prototype as { deliveryFee?: unknown }).deliveryFee)
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Ожидается JSON-объект настроек.')
    checkDepth(input)
    if (event.data.mode === 'fixed') {
      fixedMergeCatalogSettings(settings, input)
    } else {
      mergeCatalogSettings(settings, input as Record<string, unknown>)
    }
    accepted = true
  } catch (reason) {
    error = reason instanceof Error && reason.name === 'ZodError'
      ? 'Импорт отклонён: разрешены только view.sort (name или price) и view.pageSize (целое число от 1 до 100).'
      : reason instanceof Error ? reason.message : 'Не удалось применить настройки.'
  }
  const independentObject: { deliveryFee?: number } = {}
  const fee = estimateDelivery(independentObject)
  const result: PollutionResult = {
    accepted, error,
    sort: settings.view?.sort === 'price' ? 'price' : 'name',
    pageSize: typeof settings.view?.pageSize === 'number' ? settings.view.pageSize : 20,
    afterParse,
    prototypeFee: displayValue((Object.prototype as { deliveryFee?: unknown }).deliveryFee),
    newObjectFee: displayValue(independentObject.deliveryFee),
    hasOwnFee: Object.hasOwn(independentObject, 'deliveryFee'),
    deliveryFee: typeof fee === 'number' && Number.isFinite(fee) ? fee : null,
  }
  self.postMessage(result)
}
