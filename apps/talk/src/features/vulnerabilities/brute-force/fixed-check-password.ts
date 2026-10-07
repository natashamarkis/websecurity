import { verifyPassword, type Attempts, type LoginResult } from './password'

export function fixedCheckPassword(attempts: Attempts, password: string, now = Date.now()): LoginResult {
  // ИСПРАВЛЕНО: счётчик относится к аккаунту, а не к IP или вкладке.
  if (attempts.blockedUntil > now) {
    return { status: 429, message: 'Лимит попыток. Повторите позже.', retryAfter: Math.ceil((attempts.blockedUntil - now) / 1000) }
  }
  if (attempts.blockedUntil) { attempts.failures = 0; attempts.blockedUntil = 0 }
  if (verifyPassword(password)) {
    attempts.failures = 0
    return { status: 200, message: 'Вход выполнен.', authenticated: true }
  }
  attempts.failures += 1
  if (attempts.failures >= 3) attempts.blockedUntil = now + 60_000
  return { status: 401, message: 'Неверный логин или пароль.' }
}
