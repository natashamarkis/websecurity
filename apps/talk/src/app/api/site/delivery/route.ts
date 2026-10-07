import { NextResponse, type NextRequest } from 'next/server'
import { DEMO_MODE_COOKIE, resolveMode } from '@/shared/lib/demoMode'
import { createSession, CSRF_SESSION_COOKIE, findSession } from '@/features/vulnerabilities/csrf/session'
import { changeDelivery } from '@/features/vulnerabilities/csrf/change-delivery'
import { fixedChangeDelivery } from '@/features/vulnerabilities/csrf/fixed-change-delivery'

export async function GET(request: NextRequest) {
  const session = findSession(request.cookies.get(CSRF_SESSION_COOKIE)?.value) ?? createSession()
  const response = NextResponse.json({
    address: session.address,
    csrfToken: session.csrfToken,
    lastAttempt: session.lastAttempt ?? null,
  }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(CSRF_SESSION_COOKIE, session.id, {
    httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 3600,
  })
  return response
}

function result(request: NextRequest, status: number, message: string) {
  const headers = { 'Cache-Control': 'no-store' }
  if (request.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json({ ok: status === 200, message }, { status, headers })
  }
  // Только фиксированные сообщения приложения; данные формы в HTML не вставляются.
  return new NextResponse(`<!doctype html><html lang="ru"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"><title>Результат запроса</title>
    <style>body{font:18px/1.6 Arial;margin:0;border-top:4px solid #05358c;color:#232b37}main{max-width:640px;margin:64px auto;padding:24px}h1{font-size:28px;color:#05358c}a{color:#05358c}p{overflow-wrap:anywhere}</style>
    <main><p>HTTP ${status}</p><h1>${status === 200 ? 'Адрес доставки изменён' : 'Запрос отклонён'}</h1>
    <p>${message}</p><a href="/site/delivery">Вернуться в профиль</a></main></html>`, {
    status, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'" },
  })
}

export async function POST(request: NextRequest) {
  const session = findSession(request.cookies.get(CSRF_SESSION_COOKIE)?.value)
  if (!session) return result(request, 401, 'Откройте профиль для начала учебной сессии.')

  const form = await request.formData().catch(() => null)
  const address = form?.get('address')
  if (typeof address !== 'string' || address.trim().length < 5 || address.trim().length > 200) {
    return result(request, 400, 'Адрес должен содержать от 5 до 200 символов.')
  }
  const token = form?.get('csrfToken')
  const input = { address: address.trim(), csrfToken: typeof token === 'string' ? token : null }
  const vulnerable = resolveMode(request.cookies.get(DEMO_MODE_COOKIE)?.value) === 'vulnerable'
  const outcome = vulnerable ? changeDelivery(session, input) : fixedChangeDelivery(session, input)
  session.lastAttempt = { origin: request.headers.get('origin') ?? 'Без Origin', accepted: outcome.ok }
  return outcome.ok
    ? result(request, 200, 'Новый адрес сохранён в профиле.')
    : result(request, 403, outcome.error)
}
