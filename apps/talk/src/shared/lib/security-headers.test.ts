import { describe, it, expect } from 'vitest'
import { buildSecurityHeaders, buildVictimCookie } from './security-headers'

describe('buildSecurityHeaders', () => {
  it('returns no headers in vulnerable mode', () => {
    expect(buildSecurityHeaders('vulnerable')).toEqual({})
  })

  it('returns CSP and anti-framing headers in fixed mode', () => {
    const h = buildSecurityHeaders('fixed')
    expect(h['Content-Security-Policy']).toMatch(/default-src 'self'/)
    expect(h['Content-Security-Policy']).toMatch(/frame-ancestors 'none'/)
    expect(h['X-Frame-Options']).toBe('DENY')
    expect(h['X-Content-Type-Options']).toBe('nosniff')
    expect(h['Referrer-Policy']).toBeTruthy()
  })
})

describe('buildVictimCookie', () => {
  it('is readable from JS in vulnerable mode (the XSS payoff)', () => {
    const c = buildVictimCookie('vulnerable')
    expect(c.name).toBe('session')
    expect(c.options.httpOnly).toBe(false)
    expect(c.options.sameSite).toBe('none')
  })

  it('is HttpOnly + SameSite=Lax in fixed mode', () => {
    const c = buildVictimCookie('fixed')
    expect(c.options.httpOnly).toBe(true)
    expect(c.options.sameSite).toBe('lax')
  })
})
