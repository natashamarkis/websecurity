import type { RequestText } from './targets'

export async function importCatalog(url: string, requestText: RequestText) {
  // УЯЗВИМО: пользователь выбирает, куда сервер отправит HTTP-запрос.
  return requestText(url, { redirect: 'follow' })
}
