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
