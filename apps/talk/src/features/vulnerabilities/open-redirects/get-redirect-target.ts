export function getRedirectTarget(next: string, origin: string): string | null {
  try {
    // УЯЗВИМО: пользователь сам выбирает адрес, включая чужой сайт.
    return new URL(next, origin).href
  } catch {
    return null
  }
}
