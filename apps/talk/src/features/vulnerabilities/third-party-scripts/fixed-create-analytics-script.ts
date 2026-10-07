import { TRUSTED_ANALYTICS_INTEGRITY } from './integrity'

export function fixedCreateAnalyticsScript(src: string) {
  const script = document.createElement('script')
  script.src = src
  script.crossOrigin = 'anonymous'
  // Хеш заранее проверенной копии. Не пересчитываем его по ответу чужого CDN.
  script.integrity = TRUSTED_ANALYTICS_INTEGRITY
  return script
}
