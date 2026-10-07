import { NextResponse, type NextRequest } from 'next/server'
import { DEMO_MODE_COOKIE, resolveMode } from '@/shared/lib/demoMode'
import { buildSecurityHeaders, buildVictimCookie } from '@/shared/lib/security-headers'

/**
 * Next 16: proxy.ts (бывший middleware). Только для демо-сайта:
 * по cookie demo-mode ставит заголовки защиты и cookie жертвы с нужными флагами.
 */
export function proxy(request: NextRequest) {
  const mode = resolveMode(request.cookies.get(DEMO_MODE_COOKIE)?.value)
  const res = NextResponse.next()

  const thirdPartyPort = ['/site', '/site/checkout'].includes(request.nextUrl.pathname) ? Number(process.env.CSRF_ATTACKER_PORT ?? 3001) : undefined
  for (const [name, value] of Object.entries(buildSecurityHeaders(mode, thirdPartyPort))) {
    res.headers.set(name, value)
  }

  const victim = buildVictimCookie(mode)
  res.cookies.set(victim.name, victim.value, victim.options)

  return res
}

export const config = {
  matcher: ['/site/:path*'],
}
