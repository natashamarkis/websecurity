import type { ChangeResult, DeliveryChange, DeliverySession } from './session'

// УЯЗВИМО: наличие сессии не доказывает, что пользователь хотел отправить форму.
export function changeDelivery(session: DeliverySession, input: DeliveryChange): ChangeResult {
  session.address = input.address
  return { ok: true }
}
