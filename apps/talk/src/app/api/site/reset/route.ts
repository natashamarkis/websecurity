import { NextResponse, type NextRequest } from 'next/server'
import { store } from '@/shared/lib/memory-store'
import { CSRF_SESSION_COOKIE, resetDelivery } from '@/features/vulnerabilities/csrf/session'
import { isForeignOrigin } from '@/shared/lib/request-origin'
import { NOTIFICATION_SESSION_COOKIE, resetNotifications } from '@/features/vulnerabilities/clickjacking/session'
import { LAB_COOKIE, resetBackendLab } from '@/features/backend-lab/server'

/** POST → вернуть демо-сайт в стартовое состояние. */
export async function POST(request: NextRequest) {
  if (isForeignOrigin(request)) return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
  resetDelivery(request.cookies.get(CSRF_SESSION_COOKIE)?.value)
  resetNotifications(request.cookies.get(NOTIFICATION_SESSION_COOKIE)?.value)
  resetBackendLab(request.cookies.get(LAB_COOKIE)?.value)
  const state = store.reset()
  return NextResponse.json({ ok: true, comments: state.comments.length })
}
