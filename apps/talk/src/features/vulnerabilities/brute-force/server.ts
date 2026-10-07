import { z } from 'zod'
import { labHandler, labState } from '@/features/backend-lab/server'
import { checkPassword } from './check-password'
import { fixedCheckPassword } from './fixed-check-password'
import type { Attempts } from './password'

export const handleBruteForce = labHandler('brute-force', (input, context) => {
  const { password } = z.object({ password: z.string().min(1).max(100) }).strict().parse(input)
  // В лаборатории у каждого зрителя своя копия аккаунта, общая для его вкладок.
  const attempts = labState<Attempts>(context, () => ({ failures: 0, blockedUntil: 0 }))
  const result = context.mode === 'vulnerable' ? checkPassword(attempts, password) : fixedCheckPassword(attempts, password)
  return { ...result, failures: attempts.failures }
})
