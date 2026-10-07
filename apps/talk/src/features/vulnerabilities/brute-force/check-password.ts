import { verifyPassword, type Attempts, type LoginResult } from './password'

export function checkPassword(attempts: Attempts, password: string): LoginResult {
  // УЯЗВИМО: хеш проверяется, но число попыток никто не ограничивает.
  if (verifyPassword(password)) return { status: 200, message: 'Вход выполнен.', authenticated: true }
  attempts.failures += 1
  return { status: 401, message: 'Неверный логин или пароль.' }
}
