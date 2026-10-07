// БЭКЕНД: эти заголовки сервер добавляет к ответу с HTML страницы.
export function getFrameHeaders(): Record<string, string> {
  // УЯЗВИМО: нет запрета на встраивание магазина в чужой iframe.
  return {}
}
