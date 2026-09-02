import { describe, it, expect } from 'vitest'
import { highlight } from './highlight'

describe('highlight', () => {
  it('returns html with a pre block and the source tokens', async () => {
    const html = await highlight('const a = 1', 'ts')
    expect(html).toContain('<pre')
    expect(html).toContain('const')
    expect(html).toMatch(/style=|class=/)
  })

  it('escapes html in the source (no live tags leak into the slide)', async () => {
    const html = await highlight('<img src=x onerror=alert(1)>', 'html')
    // shiki разбивает токены по span'ам, поэтому проверяем сущность и отсутствие живого тега
    expect(html).not.toContain('<img')
    expect(html).toMatch(/&(lt|#x3C|#60);/)
    expect(html).toContain('onerror')
  })

  it('falls back to plain text for an unknown language', async () => {
    const html = await highlight('hello', 'no-such-lang')
    expect(html).toContain('hello')
  })
})
