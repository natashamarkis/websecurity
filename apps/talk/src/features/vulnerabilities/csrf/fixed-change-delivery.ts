import { timingSafeEqual } from 'node:crypto'
import type { ChangeResult, DeliveryChange, DeliverySession } from './session'

export function fixedChangeDelivery(session: DeliverySession, input: DeliveryChange): ChangeResult {
  const actual = Buffer.from(input.csrfToken ?? '')
  const expected = Buffer.from(session.csrfToken)

  // ИСПРАВЛЕНО: токен из формы должен совпасть с секретом этой сессии.
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return { ok: false, error: 'CSRF-токен отсутствует или не совпадает с сессией' }
  }

  session.address = input.address
  return { ok: true }
}
