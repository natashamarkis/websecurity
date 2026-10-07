import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CommentBodyVulnerable } from './render.vulnerable'
import { CommentBodyFixed } from './render.fixed'

const PAYLOAD = '<img src=x onerror=alert(1)>'

describe('vuln-xss renderers', () => {
  it('vulnerable: inserts user text as live HTML (an <img> element appears)', () => {
    const { container } = render(<CommentBodyVulnerable text={PAYLOAD} />)
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('fixed: renders the same text as plain text (no element, text visible)', () => {
    const { container } = render(<CommentBodyFixed text={PAYLOAD} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain(PAYLOAD)
  })

  it('both render ordinary text the same way', () => {
    const v = render(<CommentBodyVulnerable text="Отличный продукт" />)
    const f = render(<CommentBodyFixed text="Отличный продукт" />)
    expect(v.container.textContent).toContain('Отличный продукт')
    expect(f.container.textContent).toContain('Отличный продукт')
  })
})
