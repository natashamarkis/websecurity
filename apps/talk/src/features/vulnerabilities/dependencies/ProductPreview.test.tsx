import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ProductPreview } from './ProductPreview'
import { DEFAULT_DESCRIPTION, DEPENDENCY_PAYLOAD } from './fixtures'

describe('dependency versions', () => {
  it('delegates rendering to the vulnerable library', () => {
    const { container } = render(<ProductPreview text={DEPENDENCY_PAYLOAD} vulnerable />)
    expect(container.querySelector('img')?.getAttribute('onerror')).toContain('alert(')
  })

  it('switches the same input to the patched library', () => {
    const { container, rerender } = render(<ProductPreview text={DEPENDENCY_PAYLOAD} vulnerable />)
    rerender(<ProductPreview text={DEPENDENCY_PAYLOAD} vulnerable={false} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe(DEPENDENCY_PAYLOAD)
  })

  it.each([true, false])('preserves the plain-text contract (vulnerable=%s)', (vulnerable) => {
    const { container } = render(<ProductPreview text={DEFAULT_DESCRIPTION} vulnerable={vulnerable} />)
    expect(container.textContent).toBe(DEFAULT_DESCRIPTION)
  })
})
