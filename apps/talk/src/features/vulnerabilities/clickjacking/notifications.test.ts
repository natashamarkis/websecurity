// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as profile } from '@/app/api/site/notifications/route'
import { GET, POST } from '@/app/(site)/site/notifications/action/route'
import { POST as reset } from '@/app/api/site/reset/route'
import { createNotificationSession, disableNotifications, findNotificationSession, NOTIFICATION_SESSION_COOKIE } from './session'
import { getFrameHeaders } from './get-frame-headers'
import { fixedGetFrameHeaders } from './fixed-get-frame-headers'

const origin = 'http://127.0.0.1:3000'
const attacker = 'http://127.0.0.1:3001'
const path = `${origin}/site/notifications/action`

function request(id: string, mode: string, token?: string, source = origin) {
  return new NextRequest(path, {
    method: 'POST',
    headers: { cookie: `${NOTIFICATION_SESSION_COOKIE}=${id}; demo-mode=${mode}`, host: new URL(origin).host, origin: source },
    body: new URLSearchParams(token === undefined ? {} : { csrfToken: token }),
  })
}

describe('clickjacking notification settings', () => {
  it('uses an isolated, non-cacheable profile and a private session cookie', async () => {
    const response = profile(new NextRequest(`${origin}/api/site/notifications`))
    expect(await response.json()).toEqual({ enabled: true })
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
    const cookie = response.cookies.get(NOTIFICATION_SESSION_COOKIE)!
    expect(cookie.httpOnly).toBe(true)
    expect(cookie.sameSite).toBe('lax')
    const session = findNotificationSession(cookie.value)!
    expect(session.csrfToken).toMatch(/^[a-f0-9]{64}$/)
    expect(createNotificationSession().csrfToken).not.toBe(session.csrfToken)
  })

  it('GET renders the real form with a session token but never changes the setting', async () => {
    const session = createNotificationSession()
    const response = GET(new NextRequest(`${path}?enabled=false`, { headers: { cookie: `${NOTIFICATION_SESSION_COOKIE}=${session.id}` } }))
    expect(response.headers.get('cache-control')).toBe('no-store')
    const html = await response.text()
    expect(html).toContain('method="post" action="/site/notifications/action"')
    expect(html).toContain(`name="csrfToken" value="${session.csrfToken}"`)
    expect(html).not.toContain('<script')
    expect(session.enabled).toBe(true)
  })

  it.each(['vulnerable', 'fixed'])('accepts the legitimate form in %s mode, unlike an untrusted POST', async (mode) => {
    const session = createNotificationSession()
    const other = createNotificationSession()
    for (const token of [undefined, 'wrong', other.csrfToken, 'f'.repeat(64)]) {
      expect((await POST(request(session.id, mode, token))).status).toBe(403)
      expect(session.enabled).toBe(true)
    }
    expect((await POST(request(session.id, mode, session.csrfToken, attacker))).status).toBe(403)
    expect(session.enabled).toBe(true)
    const response = await POST(request(session.id, mode, session.csrfToken))
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('/site/notifications/action')
    expect(session.enabled).toBe(false)
    expect(other.enabled).toBe(true)
  })

  it('requires a live session to render or submit the form', async () => {
    expect(GET(new NextRequest(path)).status).toBe(401)
    expect((await POST(request('invalid', 'vulnerable'))).status).toBe(401)
    const session = createNotificationSession()
    session.expiresAt = 0
    expect((await POST(request(session.id, 'vulnerable', session.csrfToken))).status).toBe(401)
    expect(session.enabled).toBe(true)
  })

  it('rejects non-string and multibyte tokens without throwing', () => {
    const session = createNotificationSession()
    for (const token of [null, new Blob(['token']), 'я'.repeat(64)]) {
      expect(disableNotifications(session, token)).toBe(false)
      expect(session.enabled).toBe(true)
    }
  })

  it('reset preserves the token and cannot be triggered from a foreign origin', async () => {
    const session = createNotificationSession()
    const other = createNotificationSession()
    session.enabled = false
    other.enabled = false
    const token = session.csrfToken
    const headers = { cookie: `${NOTIFICATION_SESSION_COOKIE}=${session.id}`, host: new URL(origin).host }
    expect((await reset(new NextRequest(`${origin}/api/site/reset`, { method: 'POST', headers: { ...headers, origin: attacker } }))).status).toBe(403)
    expect(session.enabled).toBe(false)
    expect((await reset(new NextRequest(`${origin}/api/site/reset`, { method: 'POST', headers: { ...headers, origin } }))).status).toBe(200)
    expect(session.enabled).toBe(true)
    expect(session.csrfToken).toBe(token)
    expect(other.enabled).toBe(false)
  })

  it('compares actual server header implementations', () => {
    expect(getFrameHeaders()).toEqual({})
    expect(fixedGetFrameHeaders()).toEqual({ 'Content-Security-Policy': "frame-ancestors 'none'", 'X-Frame-Options': 'DENY' })
  })
})
