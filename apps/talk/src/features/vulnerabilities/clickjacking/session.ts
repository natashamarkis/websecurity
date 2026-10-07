import { randomBytes, timingSafeEqual } from 'node:crypto'

export const NOTIFICATION_SESSION_COOKIE = 'notification-session'
const SESSION_TTL = 60 * 60 * 1000

export interface NotificationSession {
  id: string
  csrfToken: string
  enabled: boolean
  expiresAt: number
}

const state = globalThis as typeof globalThis & { __wsNotificationSessions?: Map<string, NotificationSession> }
const sessions = state.__wsNotificationSessions ??= new Map<string, NotificationSession>()

export function findNotificationSession(id?: string): NotificationSession | undefined {
  if (!id) return undefined
  const session = sessions.get(id)
  if (session && session.expiresAt <= Date.now()) {
    sessions.delete(id)
    return undefined
  }
  return session
}

export function createNotificationSession(): NotificationSession {
  for (const [id, session] of sessions) {
    if (session.expiresAt <= Date.now()) sessions.delete(id)
  }
  if (sessions.size >= 1000) sessions.delete(sessions.keys().next().value!)
  const session: NotificationSession = {
    id: randomBytes(32).toString('hex'),
    csrfToken: randomBytes(32).toString('hex'),
    enabled: true,
    expiresAt: Date.now() + SESSION_TTL,
  }
  sessions.set(session.id, session)
  return session
}

// CSRF-проверка работает в ОБОИХ режимах: клик отправляет настоящую форму магазина.
export function disableNotifications(session: NotificationSession, csrfToken: unknown): boolean {
  if (typeof csrfToken !== 'string' || csrfToken.length !== session.csrfToken.length) return false
  const actual = Buffer.from(csrfToken)
  const expected = Buffer.from(session.csrfToken)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false
  session.enabled = false
  return true
}

export function resetNotifications(id?: string) {
  const session = findNotificationSession(id)
  if (session) session.enabled = true
}
