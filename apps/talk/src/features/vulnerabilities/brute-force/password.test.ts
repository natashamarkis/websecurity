// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { checkPassword } from './check-password'
import { fixedCheckPassword } from './fixed-check-password'

describe('server account attempt limit', () => {
  it('accepts the correct password after many failures when vulnerable', () => {
    const attempts = { failures: 0, blockedUntil: 0 }
    for (let i = 0; i < 5; i++) expect(checkPassword(attempts, 'bad').status).toBe(401)
    expect(checkPassword(attempts, 'Cable2026!').authenticated).toBe(true)
  })
  it('blocks even the correct password after three errors and later allows retry', () => {
    const attempts = { failures: 0, blockedUntil: 0 }
    for (let i = 0; i < 3; i++) expect(fixedCheckPassword(attempts, 'bad', 1000).status).toBe(401)
    expect(fixedCheckPassword(attempts, 'Cable2026!', 1001)).toMatchObject({ status: 429, retryAfter: 60 })
    expect(fixedCheckPassword(attempts, 'bad', 60_001)).toMatchObject({ status: 429, retryAfter: 1 })
    expect(attempts.failures).toBe(3)
    expect(fixedCheckPassword(attempts, 'Cable2026!', 61_000).status).toBe(200)
    expect(attempts).toEqual({ failures: 0, blockedUntil: 0 })
  })
  it('resets the failure count on a successful ordinary login', () => {
    const attempts = { failures: 2, blockedUntil: 0 }
    expect(fixedCheckPassword(attempts, 'Cable2026!').status).toBe(200)
    expect(attempts.failures).toBe(0)
  })
})
