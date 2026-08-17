import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

type Ctx = { params: Promise<{ id: string }> };

// GET: статья с телом (bodyHtml) и комментариями.
// bodyHtml и comment.html отдаются как есть и рендерятся на клиенте
// через dangerouslySetInnerHTML => DOM / stored XSS.
export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { id } = await params;
  const article = db.articles.find((a) => a.id === id);
  if (!article) {
    return NextResponse.json({ error: 'Статья не найдена' }, { status: 404 });
  }

  return NextResponse.json({ article });
}
