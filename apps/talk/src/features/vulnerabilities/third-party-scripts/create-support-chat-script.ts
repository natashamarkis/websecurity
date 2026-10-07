// Подключаем готовый чат поддержки, в том числе рядом с данными заказа.
export function createSupportChatScript(src: string) {
  const script = document.createElement('script')
  script.src = src
  script.crossOrigin = 'anonymous'
  return script
}
