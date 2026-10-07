import { NextResponse, type NextRequest } from 'next/server'
import { DEMO_MODE_COOKIE, resolveMode } from '@/shared/lib/demoMode'
import { isForeignOrigin } from '@/shared/lib/request-origin'

/** POST { mode: 'vulnerable' | 'fixed' } → ставит cookie demo-mode на весь сайт. */
export async function POST(request: NextRequest) {
  if (isForeignOrigin(request)) return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
  const body = (await request.json().catch(() => ({}))) as { mode?: unknown }
  const mode = resolveMode(typeof body.mode === 'string' ? body.mode : undefined)

  const res = NextResponse.json({ mode })
  res.cookies.set(DEMO_MODE_COOKIE, mode, { path: '/', sameSite: 'lax', httpOnly: false })
  return res
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ mode: resolveMode(request.cookies.get(DEMO_MODE_COOKIE)?.value) })
}
