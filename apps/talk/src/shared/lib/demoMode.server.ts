import { cookies } from 'next/headers'
import { DEMO_MODE_COOKIE, resolveMode, type DemoMode } from './demoMode'

/** Чтение режима в Server Components и Route Handlers. Отдельный файл, т.к. next/headers нельзя тянуть в клиент. */
export async function getServerMode(): Promise<DemoMode> {
  const store = await cookies()
  return resolveMode(store.get(DEMO_MODE_COOKIE)?.value)
}
