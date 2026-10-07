export function fixedGetRedirectTarget(next: string, origin: string): string | null {
  try {
    const target = new URL(next, origin)
    // ИСПРАВЛЕНО: разрешаем только тот же протокол, хост и порт.
    if (target.origin !== origin) return null

    return target.href
  } catch {
    return null
  }
}
