import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { publicUser, SESSION_COOKIE } from '@/lib/session';

export async function POST(req: Request) {
  const { login, password } = await req.json().catch(() => ({}));

  const user = db.users.find(
    (u) => u.login === login && u.password === password,
  );
  if (!user) {
    return NextResponse.json(
      { error: 'Неверный логин или пароль' },
      { status: 401 },
    );
  }

  const sid = randomUUID();
  db.sessions.set(sid, user.login);

  const res = NextResponse.json({ user: publicUser(user) });

  // ⚠️ УЯЗВИМОСТЬ (по паттерну оригинала): httpOnly:false => куку session-id
  // видно из document.cookie => её крадёт любой XSS.
  // sameSite:'lax' и без secure — чтобы сессия НАДЁЖНО работала на http://localhost,
  // http://127.0.0.1 и по локальной сети (Secure-куку по http часть браузеров
  // отвергает). CSRF-демо остаётся рабочим same-origin (см. csrf-poc.html).
  res.cookies.set(SESSION_COOKIE, sid, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
  });

  return res;
}
