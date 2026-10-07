import { NextResponse, type NextRequest } from 'next/server'
import { createNotificationSession, findNotificationSession, NOTIFICATION_SESSION_COOKIE } from '@/features/vulnerabilities/clickjacking/session'

export function GET(request: NextRequest) {
  const session = findNotificationSession(request.cookies.get(NOTIFICATION_SESSION_COOKIE)?.value) ?? createNotificationSession()
  const response = NextResponse.json({ enabled: session.enabled }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(NOTIFICATION_SESSION_COOKIE, session.id, {
    httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 3600,
  })
  return response
}
