import { scryptSync, timingSafeEqual } from 'node:crypto'

// Единственный вымышленный аккаунт. Соль фиксирована только для воспроизводимости стенда.
const salt = 'websecurity-local-fixture'
const storedHash = scryptSync('Cable2026!', salt, 32)
export function verifyPassword(password: string) {
  return timingSafeEqual(scryptSync(password, salt, 32), storedHash)
}
export type LoginResult = { status: number; message: string; retryAfter?: number; authenticated?: boolean }
export type Attempts = { failures: number; blockedUntil: number }
