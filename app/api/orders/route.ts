import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

// GET: список заказов с фильтром по коду.
// Фильтр возвращается СЫРЫМ в поле `filter` — клиент отображает его как чип
// через dangerouslySetInnerHTML => reflected XSS (см. Orders screen).
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const url = new URL(req.url);
  const orderCode = url.searchParams.get('orderCode') ?? '';

  const orders = orderCode
    ? db.orders.filter((o) =>
        o.orderCode.toLowerCase().includes(orderCode.toLowerCase()),
      )
    : db.orders;

  return NextResponse.json({ orders, filter: orderCode });
}
