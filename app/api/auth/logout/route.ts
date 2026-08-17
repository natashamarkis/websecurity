import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { getSessionId, SESSION_COOKIE } from '@/lib/session';

// ⚠️ УЯЗВИМОСТЬ: нет CSRF-токена — сторонний сайт может разлогинить пользователя.
export async function POST() {
  const sid = await getSessionId();
  if (sid) db.sessions.delete(sid);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
