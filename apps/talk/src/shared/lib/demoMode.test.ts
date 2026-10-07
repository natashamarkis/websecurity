import { describe, it, expect } from 'vitest'
import { resolveMode } from './demoMode'

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
