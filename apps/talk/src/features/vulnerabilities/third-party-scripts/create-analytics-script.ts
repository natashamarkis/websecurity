// Наш сайт подключает аналитику оформления заказа, доверяя содержимому URL.
export function createAnalyticsScript(src: string) {
  const script = document.createElement('script')
  script.src = src
  script.crossOrigin = 'anonymous'
  return script
}
