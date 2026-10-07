import type { DemoMode } from './demoMode'
import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from '@/entities/demo-user/model'

/**
 * Заголовки демо-сайта в fixed. CSP совместима с Next dev и antd, но разрешает
 * inline-скрипты: XSS в этом демо предотвращает экранирование в render.fixed.tsx.
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
 * Учебная cookie для XSS: в vulnerable доступна из JS, в fixed скрыта HttpOnly.
 * Для локального HTTP используем Lax: SameSite=None без Secure браузер отвергает.
 */
export function buildVictimCookie(mode: DemoMode): VictimCookie {
  const fixed = mode === 'fixed'
  return {
    name: DEMO_SESSION_COOKIE,
    value: DEMO_SESSION_VALUE,
    options: {
      path: '/',
      httpOnly: fixed,
      sameSite: 'lax',
      secure: false,
    },
  }
}
