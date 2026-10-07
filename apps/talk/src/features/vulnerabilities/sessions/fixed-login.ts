import { createSession, getSession, type Sessions } from './session-store'

// Вызывается только ПОСЛЕ проверки логина и пароля на сервере.
export function fixedLogin(sessions: Sessions, sessionId: string, verifiedUserId: string) {
  if (!getSession(sessions, sessionId)) throw new Error('Сессия истекла')
  // ИСПРАВЛЕНО: старый ID отзываем. Новый получает только вошедший клиент.
  sessions.delete(sessionId)
  return createSession(sessions, verifiedUserId)
}
