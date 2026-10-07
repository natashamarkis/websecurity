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

  it('allows the local capture monitor but not the supplier script', () => {
    const csp = buildSecurityHeaders('fixed', 3001)['Content-Security-Policy']!
    expect(csp.split('; ').find((item) => item.startsWith('script-src'))).toBe("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
    expect(csp).toContain("connect-src 'self' http://127.0.0.1:3001 http://localhost:3001")
    expect(buildSecurityHeaders('fixed')['Content-Security-Policy']).not.toContain('3001')
    expect(buildSecurityHeaders('fixed', -1)['Content-Security-Policy']).not.toContain('127.0.0.1')
  })
})

describe('buildVictimCookie', () => {
  it('is readable from JS in vulnerable mode (the XSS payoff)', () => {
    const c = buildVictimCookie('vulnerable')
    expect(c.name).toBe('session')
    expect(c.options.httpOnly).toBe(false)
    expect(c.options.sameSite).toBe('lax')
    expect(c.options.secure).toBe(false)
  })

  it('is HttpOnly + SameSite=Lax in fixed mode', () => {
    const c = buildVictimCookie('fixed')
    expect(c.options.httpOnly).toBe(true)
    expect(c.options.sameSite).toBe('lax')
  })
})
