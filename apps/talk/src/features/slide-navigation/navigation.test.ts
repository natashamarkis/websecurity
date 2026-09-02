import { describe, it, expect } from 'vitest'
import { nextRoute, prevRoute, slideRoute, type DeckOutline } from './navigation'

const outline: DeckOutline = [
  { id: 'intro', slideCount: 2 },
  { id: 'xss', slideCount: 3 },
]

describe('slideRoute', () => {
  it('builds the route for a module/index pair', () => {
    expect(slideRoute('xss', 1)).toBe('/talk/xss/1')
  })
})

describe('nextRoute', () => {
  it('moves within a module', () => {
    expect(nextRoute(outline, 'intro', 0)).toBe('/talk/intro/1')
  })
  it('crosses into the next module at the boundary', () => {
    expect(nextRoute(outline, 'intro', 1)).toBe('/talk/xss/0')
  })
  it('returns null at the very end', () => {
    expect(nextRoute(outline, 'xss', 2)).toBeNull()
  })
  it('returns null for an unknown module', () => {
    expect(nextRoute(outline, 'nope', 0)).toBeNull()
  })
})

describe('prevRoute', () => {
  it('moves within a module', () => {
    expect(prevRoute(outline, 'xss', 2)).toBe('/talk/xss/1')
  })
  it('crosses into the previous module last slide', () => {
    expect(prevRoute(outline, 'xss', 0)).toBe('/talk/intro/1')
  })
  it('returns null at the very start', () => {
    expect(prevRoute(outline, 'intro', 0)).toBeNull()
  })
})
