import { NextResponse, type NextRequest } from 'next/server'
import { store } from '@/shared/lib/memory-store'
import { demoUser } from '@/entities/demo-user/model'

export async function GET() {
  return NextResponse.json({ comments: store.listComments() })
}

/** POST { text } → добавить комментарий от имени залогиненного демо-пользователя. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { text?: unknown }
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })

  const comment = store.addComment({ author: demoUser.name, text })
  return NextResponse.json({ comment }, { status: 201 })
}
