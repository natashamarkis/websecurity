import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const list = db.articles.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    commentsCount: a.comments.length,
  }));
  return NextResponse.json({ articles: list });
}
