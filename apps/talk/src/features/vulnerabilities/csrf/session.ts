import { randomBytes } from 'node:crypto'

export const CSRF_SESSION_COOKIE = 'csrf-session'
export const INITIAL_ADDRESS = 'Москва, ул. Лесная, 10'
const SESSION_TTL = 60 * 60 * 1000

export interface DeliverySession {
  id: string
  csrfToken: string
  address: string
  expiresAt: number
  lastAttempt?: { origin: string; accepted: boolean }
}

const globalStore = globalThis as unknown as { __wsDeliverySessions?: Map<string, DeliverySession> }
globalStore.__wsDeliverySessions ??= new Map()

export function findSession(id: string | undefined): DeliverySession | undefined {
  const session = id ? globalStore.__wsDeliverySessions!.get(id) : undefined
  if (session && session.expiresAt > Date.now()) return session
  if (id) globalStore.__wsDeliverySessions!.delete(id)
}

export function createSession(): DeliverySession {
  for (const id of globalStore.__wsDeliverySessions!.keys()) findSession(id)
  const session: DeliverySession = {
    id: randomBytes(32).toString('hex'),
    csrfToken: randomBytes(32).toString('hex'),
    address: INITIAL_ADDRESS,
    expiresAt: Date.now() + SESSION_TTL,
  }
  globalStore.__wsDeliverySessions!.set(session.id, session)
  return session
}

export function resetDelivery(id: string | undefined): void {
  const session = findSession(id)
  if (!session) return
  session.address = INITIAL_ADDRESS
  delete session.lastAttempt
}

export interface DeliveryChange {
  address: string
  csrfToken: string | null
}

export type ChangeResult = { ok: true } | { ok: false; error: string }
