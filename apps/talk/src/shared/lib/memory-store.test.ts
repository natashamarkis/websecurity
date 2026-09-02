import { describe, it, expect, beforeEach } from 'vitest'
import { store } from './memory-store'

describe('memory-store', () => {
  beforeEach(() => store.reset())

  it('starts with seed comments', () => {
    expect(store.listComments().length).toBeGreaterThan(0)
  })

  it('adds a comment with id, author and createdAt', () => {
    const before = store.listComments().length
    const c = store.addComment({ author: 'alex', text: 'hello' })
    expect(c.id).toBeTruthy()
    expect(c.createdAt).toBeTruthy()
    expect(store.listComments().length).toBe(before + 1)
    expect(store.listComments().at(-1)?.text).toBe('hello')
  })

  it('reset restores the seed state', () => {
    store.addComment({ author: 'x', text: 'y' })
    const seeded = store.reset()
    expect(store.listComments()).toEqual(seeded.comments)
  })
})
