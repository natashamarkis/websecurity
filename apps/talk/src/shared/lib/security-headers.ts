import type { DemoMode } from './demoMode'
import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from '@/entities/demo-user/model'

/**
 * Заголовки защиты демо-сайта. В `vulnerable` их нет — это и есть демо
 * для clickjacking/CSRF. В `fixed` — рабочий минимум, совместимый с Next dev
 * и antd (inline-стили cssinjs).
 */
export function buildSecurityHeaders(mode: DemoMode): Record<string, string> {
  if (mode !== 'fixed') return {}

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')

  return {
    'Content-Security-Policy': csp,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }
}

export interface VictimCookie {
  name: string
  value: string
  options: {
    path: string
    httpOnly: boolean
    sameSite: 'lax' | 'strict' | 'none'
    secure: boolean
  }
}

/**
 * Сессионная cookie жертвы. В `vulnerable` доступна из JS (document.cookie) и
 * без SameSite — её и крадут в XSS/CSRF-демо. В `fixed` — HttpOnly + Lax.
 * secure=false, потому что демо живёт на http://localhost.
 */
export function buildVictimCookie(mode: DemoMode): VictimCookie {
  const fixed = mode === 'fixed'
  return {
    name: DEMO_SESSION_COOKIE,
    value: DEMO_SESSION_VALUE,
    options: {
      path: '/',
      httpOnly: fixed,
      sameSite: fixed ? 'lax' : 'none',
      secure: false,
    },
  }
}
