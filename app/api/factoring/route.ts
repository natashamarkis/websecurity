import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

// GET: список факторинг-заявок.
//  scope=own (по умолчанию) — заявки текущего пользователя (корректно)
//  scope=all — ВСЕ заявки в системе (демо-помощник, чтобы показать цели IDOR)
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const scope = new URL(req.url).searchParams.get('scope') ?? 'own';
  const source =
    scope === 'all'
      ? db.jobs
      : db.jobs.filter((j) => j.ownerLogin === user.login);

  const jobs = source.map((j) => ({
    uuid: j.uuid,
    org: j.org,
    fio: j.fio,
    amount: j.amount,
    status: j.status,
    mine: j.ownerLogin === user.login,
  }));

  return NextResponse.json({ jobs, scope });
}
