import { z } from 'zod'
import { LabError, labHandler, labState } from '@/features/backend-lab/server'
import { createSession, getSession, type Sessions } from './session-store'
import { login } from './login'
import { fixedLogin } from './fixed-login'

type State = { sessions: Sessions; attackerId: string; victimId: string; loggedIn: boolean }
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('plant') }).strict(),
  z.object({ action: z.literal('login'), password: z.string().max(100) }).strict(),
  z.object({ action: z.literal('probe') }).strict(),
  z.object({ action: z.literal('logout') }).strict(),
])

export const handleSessions = labHandler('sessions', (input, context) => {
  const command = schema.parse(input)
  const state = labState<State>(context, () => ({ sessions: new Map(), attackerId: '', victimId: '', loggedIn: false }))
  if (command.action === 'plant') {
    state.sessions.clear()
    state.attackerId = createSession(state.sessions)
    // Два клиента лаборатории моделируют уже состоявшееся навязывание ID.
    state.victimId = state.attackerId
    state.loggedIn = false
  }
  if (!state.victimId) throw new LabError(409, 'Сначала откройте навязанную сессию.')
  if (command.action === 'login') {
    if (command.password !== 'Demo-Alex-2026!') throw new LabError(401, 'Неверный логин или пароль.')
    state.victimId = context.mode === 'vulnerable'
      ? login(state.sessions, state.victimId, 'alex')
      : fixedLogin(state.sessions, state.victimId, 'alex')
    state.loggedIn = true
  }
  if (command.action === 'logout') {
    state.sessions.delete(state.victimId)
    state.victimId = createSession(state.sessions)
    state.loggedIn = false
  }
  const attacker = command.action === 'probe' ? getSession(state.sessions, state.attackerId) : null
  const stolen = attacker?.userId === 'alex'
  return {
    status: command.action === 'probe' && !stolen ? 401 : 200,
    message: command.action === 'probe' ? stolen ? 'Атакующий получил профиль Алекса без пароля.' : 'Старый ID не даёт доступа к аккаунту.'
      : command.action === 'plant' ? 'Оба клиента используют один анонимный ID.'
        : command.action === 'logout' ? 'Сессия отозвана сервером.' : 'Покупатель вошёл в аккаунт.',
    attackerId: state.attackerId, victimId: state.victimId, loggedIn: state.loggedIn,
    profile: stolen ? { name: 'Алекс', email: 'alex@example.test', address: 'ул. Лесная, 10' } : null,
  }
})
