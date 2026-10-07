import { createSupportChatScript } from './create-support-chat-script'

export function fixedCreateSupportChatScript(src: string, pathname: string) {
  // На оформлении заказа чужой JavaScript вообще не загружаем.
  if (pathname === '/site/checkout') return null

  return createSupportChatScript(src)
}
