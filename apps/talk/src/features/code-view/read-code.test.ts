import { describe, it, expect } from 'vitest'
import { readCode } from './read-code'

describe('readCode', () => {
  it('reads a file relative to src', async () => {
    const code = await readCode('shared/lib/highlight.ts')
    expect(code).toContain('shiki')
  })

  it('rejects path traversal outside src', async () => {
    await expect(readCode('../package.json')).rejects.toThrow(/outside/)
  })

  it('rejects absolute paths', async () => {
    await expect(readCode('C:/Windows/win.ini')).rejects.toThrow(/outside/)
    await expect(readCode('/etc/passwd')).rejects.toThrow(/outside/)
  })

  it('reports a readable error for a missing file', async () => {
    await expect(readCode('features/nope/missing.tsx')).rejects.toThrow(/missing\.tsx/)
  })
})
