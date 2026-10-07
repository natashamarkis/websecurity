import { randomBytes } from 'node:crypto'

export type Session = { userId: string | null; expiresAt: number }
export type Sessions = Map<string, Session>
export const SESSION_TTL = 15 * 60 * 1000

export function createSession(sessions: Sessions, userId: string | null = null, now = Date.now()) {
  const id = randomBytes(32).toString('hex')
  sessions.set(id, { userId, expiresAt: now + SESSION_TTL })
  return id
}

export function getSession(sessions: Sessions, id: string, now = Date.now()) {
  const session = sessions.get(id)
  if (session && session.expiresAt > now) return session
  sessions.delete(id)
  return null
}
