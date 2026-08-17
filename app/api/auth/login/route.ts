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

  // ⚠️ УЯЗВИМОСТЬ (по паттерну оригинала):
  //  - httpOnly: false  => куку session-id видно из document.cookie => крадёт любой XSS
  //  - sameSite: 'none' => кука уходит на кросс-сайтовые запросы => возможен CSRF
  //    (secure: true нужен для SameSite=None; на http://localhost Chrome/Firefox
  //     считают localhost «secure context» и принимают такую куку)
  res.cookies.set(SESSION_COOKIE, sid, {
    httpOnly: false,
    sameSite: 'none',
    secure: true,
    path: '/',
  });

  return res;
}
