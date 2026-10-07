// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createSession, getSession, SESSION_TTL, type Sessions } from './session-store'
import { login } from './login'
import { fixedLogin } from './fixed-login'

describe('session fixation', () => {
  it('keeps the attacker-known ID authenticated in vulnerable mode', () => {
    const sessions: Sessions = new Map()
    const id = createSession(sessions)
    expect(login(sessions, id, 'alex')).toBe(id)
    expect(getSession(sessions, id)?.userId).toBe('alex')
  })
  it('revokes the old ID and returns a fresh authenticated session', () => {
    const sessions: Sessions = new Map()
    const id = createSession(sessions)
    const fresh = fixedLogin(sessions, id, 'alex')
    expect(fresh).not.toBe(id)
    expect(fresh).toMatch(/^[a-f0-9]{64}$/)
    expect(getSession(sessions, id)).toBeNull()
    expect(getSession(sessions, fresh)?.userId).toBe('alex')
    sessions.delete(fresh)
    expect(getSession(sessions, fresh)).toBeNull()
  })
  it('expires sessions and rejects unknown IDs in both implementations', () => {
    const sessions: Sessions = new Map()
    const id = createSession(sessions, null, 1000)
    expect(getSession(sessions, id, 1000 + SESSION_TTL)).toBeNull()
    expect(sessions.size).toBe(0)
    expect(() => login(sessions, id, 'alex')).toThrow()
    expect(() => fixedLogin(sessions, 'invented-id', 'alex')).toThrow()
  })
})
