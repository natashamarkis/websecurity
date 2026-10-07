import { randomBytes } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { DEMO_MODE_COOKIE, resolveMode, type DemoMode } from '@/shared/lib/demoMode'
import { isForeignOrigin } from '@/shared/lib/request-origin'

export const LAB_COOKIE = 'backend-lab'
const TTL = 60 * 60 * 1000
type Entry = { expires: number; values: Map<string, unknown> }
const globalStore = globalThis as unknown as { __backendLabs?: Map<string, Entry> }
const labs = globalStore.__backendLabs ??= new Map()
export type LabContext = { id: string; mode: DemoMode; topic: string }
export type LabReply = { status: number; message: string; [key: string]: unknown }
export class LabError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

function getLab(id?: string) {
  const now = Date.now()
  for (const [key, entry] of labs) if (entry.expires <= now) labs.delete(key)
  if (id && labs.has(id)) return id
  if (labs.size >= 200) labs.delete(labs.keys().next().value!)
  const created = randomBytes(24).toString('hex')
  labs.set(created, { expires: now + TTL, values: new Map() })
  return created
}

export function labState<T>(context: LabContext, create: () => T): T {
  const entry = labs.get(context.id)
  if (!entry) throw new LabError(401, 'Учебная сессия истекла. Обновите страницу.')
  const key = `${context.topic}:${context.mode}`
  if (!entry.values.has(key)) entry.values.set(key, create())
  return entry.values.get(key) as T
}

export function resetBackendLab(id?: string) {
  if (id) labs.get(id)?.values.clear()
}

export function labHandler(topic: string, run: (input: unknown, context: LabContext) => Promise<LabReply> | LabReply) {
  return async (request: NextRequest) => {
    if (isForeignOrigin(request)) return NextResponse.json({ message: 'Чужой Origin запрещён.' }, { status: 403 })
    const id = getLab(request.cookies.get(LAB_COOKIE)?.value)
    const context = { id, topic, mode: resolveMode(request.cookies.get(DEMO_MODE_COOKIE)?.value) }
    let result: LabReply
    try {
      if (!request.headers.get('content-type')?.startsWith('application/json')) throw new LabError(415, 'Ожидается JSON.')
      // Ограничение оболочки лаборатории, одинаковое для обоих режимов.
      const reader = request.body?.getReader()
      const chunks: Uint8Array[] = []
      let size = 0
      if (reader) {
        try {
          while (true) {
            const chunk = await reader.read()
            if (chunk.done) break
            size += chunk.value.length
            if (size > 4096) throw new LabError(413, 'Запрос слишком большой.')
            chunks.push(chunk.value)
          }
        } finally { await reader.cancel() }
      }
      let input: unknown
      try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw new LabError(400, 'Некорректный JSON.') }
      if (typeof input === 'object' && input !== null && 'action' in input && input.action === 'reset') {
        labs.get(id)!.values.delete(`${topic}:${context.mode}`)
        result = { status: 200, message: 'Готово к новому запуску.' }
      } else result = await run(input, context)
    } catch (error) {
      result = error instanceof LabError
        ? { status: error.status, message: error.message }
        : { status: 400, message: 'Некорректный запрос или недоступный учебный ресурс.' }
    }
    const response = NextResponse.json(result, {
      status: result.status,
      headers: { 'Cache-Control': 'no-store', ...(result.status === 429 ? { 'Retry-After': String(result.retryAfter ?? 60) } : {}) },
    })
    response.cookies.set(LAB_COOKIE, id, { httpOnly: true, sameSite: 'strict', secure: new URL(request.url).protocol === 'https:', path: '/', maxAge: TTL / 1000 })
    return response
  }
}
