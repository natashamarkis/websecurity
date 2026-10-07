// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { labHandler, labState, LAB_COOKIE } from './server'
import { handleBruteForce } from '@/features/vulnerabilities/brute-force/server'
import { handleSessions } from '@/features/vulnerabilities/sessions/server'
import { handleSql } from '@/features/vulnerabilities/sql-injection/server'
import { handleFiles } from '@/features/vulnerabilities/file-download/server'

function request(body: unknown, cookie = '', mode = 'fixed', origin = 'http://127.0.0.1:3000') {
  return new NextRequest('http://127.0.0.1:3000/api/site/backend/test', {
    method: 'POST', headers: { origin, host: '127.0.0.1:3000', 'Content-Type': 'application/json', cookie: `${cookie}; demo-mode=${mode}` },
    body: JSON.stringify(body),
  })
}

describe('backend lab transport', () => {
  it('isolates viewers and modes, and resets only the current topic and mode', async () => {
    const handler = labHandler('counter', (_, context) => {
      const state = labState(context, () => ({ count: 0 }))
      return { status: 200, message: 'ok', count: ++state.count }
    })
    const first = await handler(request({}))
    const cookie = `${LAB_COOKIE}=${first.cookies.get(LAB_COOKIE)!.value}`
    expect(first.cookies.get(LAB_COOKIE)?.httpOnly).toBe(true)
    expect(first.headers.get('cache-control')).toBe('no-store')
    expect((await (await handler(request({}, cookie))).json()).count).toBe(2)
    expect((await (await handler(request({}))).json()).count).toBe(1)
    expect((await (await handler(request({}, cookie, 'vulnerable'))).json()).count).toBe(1)
    await handler(request({ action: 'reset' }, cookie))
    expect((await (await handler(request({}, cookie))).json()).count).toBe(1)
    expect((await (await handler(request({}, cookie, 'vulnerable'))).json()).count).toBe(2)
  })
  it('rejects cross-origin commands, invalid JSON and oversized bodies', async () => {
    const handler = labHandler('test', () => ({ status: 200, message: 'ok' }))
    expect((await handler(request({}, '', 'fixed', 'http://127.0.0.1:3001'))).status).toBe(403)
    expect((await handler(request({ value: 'x'.repeat(5000) }))).status).toBe(413)
    const malformed = new NextRequest('http://127.0.0.1:3000/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })
    expect((await handler(malformed)).status).toBe(400)
  })
  it('returns real 429 with Retry-After and shares the counter across requests', async () => {
    const reset = await handleBruteForce(request({ action: 'reset' }))
    const cookie = `${LAB_COOKIE}=${reset.cookies.get(LAB_COOKIE)!.value}`
    for (let index = 0; index < 3; index++) expect((await handleBruteForce(request({ password: 'wrong' }, cookie))).status).toBe(401)
    const blocked = await handleBruteForce(request({ password: 'Cable2026!' }, cookie))
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0)
    expect((await handleBruteForce(request({ password: 'Cable2026!' }))).status).toBe(200)
  })
  it.each(['vulnerable', 'fixed'])('executes the session fixation scenario in %s', async (mode) => {
    const planted = await handleSessions(request({ action: 'plant' }, '', mode))
    const cookie = `${LAB_COOKIE}=${planted.cookies.get(LAB_COOKIE)!.value}`
    expect((await handleSessions(request({ action: 'probe' }, cookie, mode))).status).toBe(401)
    expect((await handleSessions(request({ action: 'login', password: 'bad' }, cookie, mode))).status).toBe(401)
    expect((await handleSessions(request({ action: 'probe' }, cookie, mode))).status).toBe(401)
    const loggedIn = await (await handleSessions(request({ action: 'login', password: 'Demo-Alex-2026!' }, cookie, mode))).json()
    expect(loggedIn.loggedIn).toBe(true)
    expect(loggedIn.victimId === loggedIn.attackerId).toBe(mode === 'vulnerable')
    const attacker = await handleSessions(request({ action: 'probe' }, cookie, mode))
    expect(attacker.status).toBe(mode === 'vulnerable' ? 200 : 401)
    await handleSessions(request({ action: 'logout' }, cookie, mode))
    expect((await handleSessions(request({ action: 'probe' }, cookie, mode))).status).toBe(401)
  })
  it('does not accept a forged owner and bounds SQL/file inputs in both modes', async () => {
    for (const mode of ['fixed', 'vulnerable']) {
      expect((await handleSql(request({ search: '', userId: 'maria' }, '', mode))).status).toBe(400)
      expect((await handleSql(request({ search: "' UNION SELECT randomblob(99999999) --" }, '', mode))).status).toBe(400)
      expect((await handleFiles(request({ action: 'document', documentId: '1002', userId: 'maria' }, '', mode))).status).toBe(400)
      for (const filename of ['../../.env', '//evil.test/share/file', 'C:\\Windows\\win.ini']) {
        expect((await handleFiles(request({ action: 'path', filename }, '', mode))).status).toBe(400)
      }
    }
  })
})
