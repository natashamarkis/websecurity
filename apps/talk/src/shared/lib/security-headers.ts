import type { DemoMode } from './demoMode'
import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from '@/entities/demo-user/model'
import { getFrameHeaders } from '@/features/vulnerabilities/clickjacking/get-frame-headers'
import { fixedGetFrameHeaders } from '@/features/vulnerabilities/clickjacking/fixed-get-frame-headers'

/**
 * Заголовки демо-сайта в fixed. CSP совместима с Next dev и antd, но разрешает
 * inline-скрипты: XSS в этом демо предотвращает экранирование в FixedXssInject.tsx.
 */
export function buildSecurityHeaders(mode: DemoMode, thirdPartyPort?: number): Record<string, string> {
  const frameHeaders = mode === 'vulnerable' ? getFrameHeaders() : fixedGetFrameHeaders()
  if (mode !== 'fixed') return frameHeaders

  // В SRI-демо разрешаем сервер скрипта: подмену должен остановить хеш, не CSP.
  const localOrigins = thirdPartyPort && Number.isInteger(thirdPartyPort) && thirdPartyPort > 0 && thirdPartyPort <= 65535
    ? ` http://127.0.0.1:${thirdPartyPort} http://localhost:${thirdPartyPort}` : ''

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'" + localOrigins,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'" + localOrigins,
    frameHeaders['Content-Security-Policy'],
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')

  return {
    ...frameHeaders,
    'Content-Security-Policy': csp,
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
