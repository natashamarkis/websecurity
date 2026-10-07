import { NextResponse } from 'next/server'
import { store } from '@/shared/lib/memory-store'

/** POST → вернуть демо-сайт в стартовое состояние. */
export async function POST() {
  const state = store.reset()
  return NextResponse.json({ ok: true, comments: state.comments.length })
}
