import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

type Ctx = { params: Promise<{ uuid: string }> };

// GET ⚠️ IDOR: возвращает ЛЮБУЮ факторинг-заявку по uuid.
// Проверяется только факт авторизации, но НЕ владелец заявки
// (нет сравнения job.ownerLogin === user.login). Подставив чужой uuid,
// пользователь видит данные другой организации.
export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { uuid } = await params;
  const job = db.jobs.find((j) => j.uuid === uuid);
  if (!job) {
    return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
  }

  return NextResponse.json({ job });
}

// POST ⚠️ IDOR + CSRF: меняет статус/сумму любой заявки.
//  - нет проверки владельца (IDOR)
//  - нет CSRF-токена, а кука SameSite=None => сработает cross-site форма
//  - принимает и JSON, и form-urlencoded => классический CSRF через
//    авто-сабмит формы с чужого сайта
export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { uuid } = await params;
  const job = db.jobs.find((j) => j.uuid === uuid);
  if (!job) {
    return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
  }

  let status: unknown;
  let amount: unknown;
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    status = body.status;
    amount = body.amount;
  } else {
    const form = await req.formData().catch(() => null);
    status = form?.get('status') ?? undefined;
    const rawAmount = form?.get('amount');
    amount = rawAmount != null ? Number(rawAmount) : undefined;
  }

  if (typeof status === 'string' && status) job.status = status;
  if (typeof amount === 'number' && !Number.isNaN(amount)) job.amount = amount;

  return NextResponse.json({ job });
}
