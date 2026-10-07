// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/site/delivery/route'
import { POST as setMode } from '@/app/api/demo-mode/route'
import { POST as reset } from '@/app/api/site/reset/route'
import { createSession, CSRF_SESSION_COOKIE, findSession, INITIAL_ADDRESS } from './session'

const origin = 'http://127.0.0.1:3000'
const attacker = 'http://127.0.0.1:3001'

function request(sessionId: string, mode: string, fields: Record<string, string>, source = attacker) {
  return new NextRequest(`${origin}/api/site/delivery`, {
    method: 'POST',
    headers: { cookie: `${CSRF_SESSION_COOKIE}=${sessionId}; demo-mode=${mode}`, origin: source, accept: 'application/json' },
    body: new URLSearchParams(fields),
  })
}

describe('CSRF delivery API', () => {
  it('starts isolated sessions with a private cookie and non-cacheable tokens', async () => {
    const response = await GET(new NextRequest(`${origin}/api/site/delivery`))
    expect(response.headers.get('cache-control')).toBe('no-store')
    const cookie = response.cookies.get(CSRF_SESSION_COOKIE)!
    expect(cookie.httpOnly).toBe(true)
    expect(cookie.sameSite).toBe('lax')
    const body = await response.json()
    expect(body.csrfToken).toMatch(/^[a-f0-9]{64}$/)
    expect(body.address).toBe(INITIAL_ADDRESS)
    expect(createSession().csrfToken).not.toBe(body.csrfToken)
    expect(findSession(cookie.value)?.csrfToken).toBe(body.csrfToken)
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('does not change state via GET query parameters', async () => {
    const session = createSession()
    const response = await GET(new NextRequest(`${origin}/api/site/delivery?address=forged`, {
      headers: { cookie: `${CSRF_SESSION_COOKIE}=${session.id}` },
    }))
    expect((await response.json()).address).toBe(INITIAL_ADDRESS)
  })

  it.each(['vulnerable', 'fixed'])('requires a valid session in %s mode', async (mode) => {
    const response = await POST(request('invalid', mode, { address: 'Forged address' }))
    expect(response.status).toBe(401)
  })

  it('rejects expired sessions', async () => {
    const session = createSession()
    session.expiresAt = 0
    expect((await POST(request(session.id, 'vulnerable', { address: 'Forged address' }))).status).toBe(401)
  })

  it('accepts a forged form in vulnerable mode without changing another session', async () => {
    const session = createSession()
    const other = createSession()
    const response = await POST(request(session.id, 'vulnerable', { address: 'Forged address' }))
    expect(response.status).toBe(200)
    expect(session.address).toBe('Forged address')
    expect(other.address).toBe(INITIAL_ADDRESS)
    expect(session.lastAttempt).toEqual({ origin: attacker, accepted: true })
  })

  it.each([undefined, 'wrong', 'f'.repeat(64)])('rejects absent or incorrect token %s in fixed mode', async (csrfToken) => {
    const session = createSession()
    const fields: Record<string, string> = { address: 'Forged address' }
    if (csrfToken !== undefined) fields.csrfToken = csrfToken
    expect((await POST(request(session.id, 'fixed', fields))).status).toBe(403)
    expect(session.address).toBe(INITIAL_ADDRESS)
    expect(session.lastAttempt?.accepted).toBe(false)
  })

  it('rejects a token belonging to another session', async () => {
    const session = createSession()
    expect((await POST(request(session.id, 'fixed', { address: 'Forged address', csrfToken: createSession().csrfToken }))).status).toBe(403)
    expect(session.address).toBe(INITIAL_ADDRESS)
  })

  it('accepts the legitimate form in fixed mode', async () => {
    const session = createSession()
    const response = await POST(request(session.id, 'fixed', { address: 'New address', csrfToken: session.csrfToken }, origin))
    expect(response.status).toBe(200)
    expect(session.address).toBe('New address')
  })

  it.each(['', 'a', 'a'.repeat(201)])('rejects invalid address length %s', async (address) => {
    const session = createSession()
    expect((await POST(request(session.id, 'vulnerable', { address }))).status).toBe(400)
    expect(session.address).toBe(INITIAL_ADDRESS)
  })

  it('does not let an external form disable protection or reset data', async () => {
    const session = createSession()
    session.address = 'Saved address'
    const headers = { origin: attacker, cookie: `${CSRF_SESSION_COOKIE}=${session.id}` }
    expect((await setMode(new NextRequest(`${origin}/api/demo-mode`, {
      method: 'POST', headers, body: JSON.stringify({ mode: 'vulnerable' }),
    }))).status).toBe(403)
    expect((await reset(new NextRequest(`${origin}/api/site/reset`, { method: 'POST', headers }))).status).toBe(403)
    expect(session.address).toBe('Saved address')
  })

  it('resets only the current delivery profile and preserves its token', async () => {
    const session = createSession()
    const other = createSession()
    session.address = 'Changed address'
    other.address = 'Another address'
    const token = session.csrfToken
    expect((await reset(new NextRequest(`${origin}/api/site/reset`, {
      method: 'POST', headers: { origin, host: new URL(origin).host, cookie: `${CSRF_SESSION_COOKIE}=${session.id}` },
    }))).status).toBe(200)
    expect(session.address).toBe(INITIAL_ADDRESS)
    expect(session.csrfToken).toBe(token)
    expect(other.address).toBe('Another address')
  })
})
