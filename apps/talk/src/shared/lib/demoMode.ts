export type DemoMode = 'vulnerable' | 'fixed'

export const DEMO_MODE_COOKIE = 'demo-mode'

/** По умолчанию — уязвимая версия; `fixed` только при точном совпадении. */
export function resolveMode(raw: string | undefined | null): DemoMode {
  return raw === 'fixed' ? 'fixed' : 'vulnerable'
}

/** Единая точка выбора реализации: pick(vulnerableImpl, fixedImpl, mode). */
export function pick<T>(vulnerable: T, fixed: T, mode: DemoMode): T {
  return mode === 'fixed' ? fixed : vulnerable
}

/** Разбор сырого заголовка Cookie (для proxy.ts и тестов). */
export function parseModeFromCookieHeader(header: string | undefined | null): DemoMode {
  if (!header) return 'vulnerable'
  const pair = header
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${DEMO_MODE_COOKIE}=`))
  return resolveMode(pair?.slice(DEMO_MODE_COOKIE.length + 1))
}

/** Чтение режима на клиенте (document.cookie). */
export function getClientMode(): DemoMode {
  if (typeof document === 'undefined') return 'vulnerable'
  return parseModeFromCookieHeader(document.cookie)
}
