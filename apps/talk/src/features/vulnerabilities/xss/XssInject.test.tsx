import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { XssInject } from './XssInject'
import { FixedXssInject } from './FixedXssInject'

const PAYLOAD = '<img src=x onerror=alert(1)>'

describe('XSS renderers', () => {
  it('vulnerable: inserts user text as live HTML (an <img> element appears)', () => {
    const { container } = render(<XssInject text={PAYLOAD} />)
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('fixed: renders the same text as plain text (no element, text visible)', () => {
    const { container } = render(<FixedXssInject text={PAYLOAD} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain(PAYLOAD)
  })

  it('both render ordinary text the same way', () => {
    const v = render(<XssInject text="Отличный продукт" />)
    const f = render(<FixedXssInject text="Отличный продукт" />)
    expect(v.container.textContent).toContain('Отличный продукт')
    expect(f.container.textContent).toContain('Отличный продукт')
  })
})
