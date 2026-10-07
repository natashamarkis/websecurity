import { NextResponse, type NextRequest } from 'next/server'
import { handleSsrf } from '@/features/vulnerabilities/ssrf/server'
import { handleSessions } from '@/features/vulnerabilities/sessions/server'
import { handleSql } from '@/features/vulnerabilities/sql-injection/server'
import { handleBruteForce } from '@/features/vulnerabilities/brute-force/server'
import { handleFiles } from '@/features/vulnerabilities/file-download/server'

export const runtime = 'nodejs'
const handlers: Record<string, (request: NextRequest) => Promise<NextResponse>> = {
  ssrf: handleSsrf, sessions: handleSessions, 'sql-injection': handleSql,
  'brute-force': handleBruteForce, 'file-download': handleFiles,
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params
  if (!Object.hasOwn(handlers, topic)) return NextResponse.json({ message: 'Тема не найдена.' }, { status: 404 })
  return handlers[topic]!(request)
}
