import { getSession, type Sessions } from './session-store'

// Вызывается только ПОСЛЕ проверки логина и пароля на сервере.
export function login(sessions: Sessions, sessionId: string, verifiedUserId: string) {
  const session = getSession(sessions, sessionId)
  if (!session) throw new Error('Сессия истекла')
  // УЯЗВИМО: известный атакующему ID теперь открывает аккаунт покупателя.
  session.userId = verifiedUserId
  return sessionId
}
