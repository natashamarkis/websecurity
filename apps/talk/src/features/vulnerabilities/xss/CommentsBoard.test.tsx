import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { CommentsBoard } from './CommentsBoard'

const PAYLOAD = '<img src=x onerror=alert(1)>'

vi.mock('@/shared/lib/demoMode.server', () => ({ getServerMode: vi.fn() }))
vi.mock('@/shared/lib/memory-store', () => ({
  store: {
    listComments: () => [{ id: '1', author: 'Alex', text: '<img src=x onerror=alert(1)>' }],
  },
}))
vi.mock('./CommentForm', () => ({ CommentForm: () => null }))

describe('CommentsBoard mode selection', () => {
  it.each(['vulnerable', 'fixed'] as const)('renders the %s implementation', async (mode) => {
    vi.mocked(getServerMode).mockResolvedValue(mode)
    const { container } = render(await CommentsBoard())

    expect(container.querySelectorAll('[data-testid="comment"]')).toHaveLength(1)
    if (mode === 'vulnerable') {
      expect(container.querySelector('img')).not.toBeNull()
      expect(container.textContent).not.toContain(PAYLOAD)
    } else {
      expect(container.querySelector('img')).toBeNull()
      expect(container.textContent).toContain(PAYLOAD)
    }
  })
})
