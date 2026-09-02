import { describe, it, expect } from 'vitest'
import { resolveMode, pick, DEMO_MODE_COOKIE, parseModeFromCookieHeader } from './demoMode'

describe('resolveMode', () => {
  it('defaults to vulnerable', () => {
    expect(resolveMode(undefined)).toBe('vulnerable')
    expect(resolveMode('')).toBe('vulnerable')
    expect(resolveMode('garbage')).toBe('vulnerable')
  })

  it('returns fixed only on exact match', () => {
    expect(resolveMode('fixed')).toBe('fixed')
    expect(resolveMode('Fixed')).toBe('vulnerable')
    expect(resolveMode(' fixed')).toBe('vulnerable')
  })
})

describe('pick', () => {
  it('chooses the branch by mode', () => {
    expect(pick('v', 'f', 'vulnerable')).toBe('v')
    expect(pick('v', 'f', 'fixed')).toBe('f')
  })
})

describe('parseModeFromCookieHeader', () => {
  it('reads the demo-mode cookie from a raw Cookie header', () => {
    expect(parseModeFromCookieHeader(`a=1; ${DEMO_MODE_COOKIE}=fixed; b=2`)).toBe('fixed')
    expect(parseModeFromCookieHeader(`a=1; b=2`)).toBe('vulnerable')
    expect(parseModeFromCookieHeader(undefined)).toBe('vulnerable')
  })
})
