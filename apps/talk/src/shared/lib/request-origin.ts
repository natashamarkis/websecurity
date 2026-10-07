/** Защита управляющих кнопок демо от запросов со страницы акции. */
export function isForeignOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const url = new URL(request.url)
  // NextRequest может нормализовать loopback в localhost; Host сохраняет адрес браузера.
  const host = request.headers.get('host')
  const expected = host ? `${url.protocol}//${host}` : url.origin
  return origin !== null && origin !== expected
}
