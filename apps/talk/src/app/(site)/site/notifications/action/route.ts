import { NextResponse, type NextRequest } from 'next/server'
import { disableNotifications, findNotificationSession, NOTIFICATION_SESSION_COOKIE } from '@/features/vulnerabilities/clickjacking/session'
import { notificationPage } from '@/features/vulnerabilities/clickjacking/notification-page'
import { isForeignOrigin } from '@/shared/lib/request-origin'

const headers = { 'Cache-Control': 'no-store' }

// Route Handler отдаёт обычную HTML-форму без панели управления демонстрацией.
// Общий proxy добавляет выбранные защитные заголовки ко всем ответам /site/*.
export function GET(request: NextRequest) {
  const session = findNotificationSession(request.cookies.get(NOTIFICATION_SESSION_COOKIE)?.value)
  if (!session) return new NextResponse('Откройте профиль магазина, чтобы начать учебную сессию.', { status: 401, headers })
  return new NextResponse(notificationPage(session), { headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function POST(request: NextRequest) {
  const session = findNotificationSession(request.cookies.get(NOTIFICATION_SESSION_COOKIE)?.value)
  if (!session) return new NextResponse('Нет сессии', { status: 401, headers })
  if (isForeignOrigin(request)) return new NextResponse('Чужой Origin', { status: 403, headers })
  const form = await request.formData().catch(() => null)
  if (!disableNotifications(session, form?.get('csrfToken'))) {
    return new NextResponse('Неверный CSRF-токен', { status: 403, headers })
  }
  return new NextResponse(null, { status: 303, headers: { ...headers, Location: '/site/notifications/action' } })
}
