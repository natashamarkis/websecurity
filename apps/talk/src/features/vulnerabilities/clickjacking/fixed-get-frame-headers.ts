// БЭКЕНД: заголовки ответа магазина, не страницы атакующего.
export function fixedGetFrameHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': "frame-ancestors 'none'",
    'X-Frame-Options': 'DENY',
  }
}
