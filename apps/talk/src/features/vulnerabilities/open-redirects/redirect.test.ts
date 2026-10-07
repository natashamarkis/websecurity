import { describe, expect, it } from 'vitest'
import { getRedirectTarget } from './get-redirect-target'
import { fixedGetRedirectTarget } from './fixed-get-redirect-target'
import { demoDestinations, isDemoDestination } from './destinations'

const origin = 'http://127.0.0.1:3000'

describe('open redirect', () => {
  it('accepts an arbitrary external destination in vulnerable code', () => {
    expect(getRedirectTarget('https://outside.example.test/login', origin)).toBe('https://outside.example.test/login')
  })

  it.each([
    'http://127.0.0.1:3001/redirect-offer',
    '//127.0.0.1:3001/redirect-offer',
    'http://localhost:3000/login',
    'https://127.0.0.1:3000/login',
    'http://127.0.0.1:3000@outside.example.test/login',
    'http://127.0.0.1:3000.outside.example.test/login',
    '\\\\outside.example.test/login',
    'javascript:alert(1)',
    'data:text/html,hello',
    'http://[broken',
  ])('rejects an external, executable or invalid URL: %s', (next) => {
    expect(fixedGetRedirectTarget(next, origin)).toBeNull()
  })

  it.each([
    ['/site/redirect/order', `${origin}/site/redirect/order`],
    [`${origin}/site/redirect/order`, `${origin}/site/redirect/order`],
    ['/site/redirect/order?source=mail#details', `${origin}/site/redirect/order?source=mail#details`],
    ['/site/../site/redirect/order', `${origin}/site/redirect/order`],
  ])('retains a normalized same-origin URL: %s', (next, expected) => {
    expect(fixedGetRedirectTarget(next, origin)).toBe(expected)
  })

  it('validates the query parameter after the standard URL parser decodes it', () => {
    const next = new URLSearchParams('next=%2F%2Foutside.example.test%2Flogin').get('next')!
    expect(fixedGetRedirectTarget(next, origin)).toBeNull()
  })

  it('returns null for malformed input in vulnerable mode too', () => {
    expect(getRedirectTarget('http://[broken', origin)).toBeNull()
  })
})

describe('local demonstration boundary', () => {
  it('allows only the two prepared destinations, independently of the vulnerable resolver', () => {
    const destinations = demoDestinations(origin, 3001)
    expect(destinations.external).toBe('http://127.0.0.1:3001/redirect-offer?shopPort=3000')
    expect(isDemoDestination(destinations.external, origin, 3001)).toBe(true)
    expect(isDemoDestination(destinations.internal, origin, 3001)).toBe(true)
    expect(isDemoDestination('https://outside.example.test', origin, 3001)).toBe(false)
    expect(isDemoDestination(`${origin}/api/demo-mode`, origin, 3001)).toBe(false)
    expect(isDemoDestination(destinations.external + '&extra=secret', origin, 3001)).toBe(false)
  })

  it('uses the configured host and ports', () => {
    expect(demoDestinations('http://localhost:3100', 3101).external).toBe('http://localhost:3101/redirect-offer?shopPort=3100')
    expect(() => demoDestinations(origin, -1)).toThrow('Invalid local port')
  })
})
