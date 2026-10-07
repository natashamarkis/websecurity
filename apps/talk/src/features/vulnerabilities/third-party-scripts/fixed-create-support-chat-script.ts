import { TRUSTED_CHAT_INTEGRITY } from './integrity'

export function fixedCreateSupportChatScript(src: string) {
  const script = document.createElement('script')
  script.src = src
  script.crossOrigin = 'anonymous'
  // На любой странице: браузер проверяет файл ДО выполнения.
  script.integrity = TRUSTED_CHAT_INTEGRITY
  return script
}
