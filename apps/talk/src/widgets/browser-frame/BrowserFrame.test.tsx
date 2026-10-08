import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserFrame } from './BrowserFrame'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

describe('BrowserFrame', () => {
  it('shows toolbar controls and children without an address bar or host badge', () => {
    render(
      <BrowserFrame mode="vulnerable">
        <div>site body</div>
      </BrowserFrame>,
    )
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Адрес демонстрации')).not.toBeInTheDocument()
    expect(screen.queryByText(/localhost|127\.0\.0\.1/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /к слайду/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /сбросить/i })).toBeInTheDocument()
    expect(screen.getByText('site body')).toBeInTheDocument()
  })

  it('shows the payload button only when a payload is given', () => {
    const { rerender } = render(
      <BrowserFrame mode="vulnerable">
        <div />
      </BrowserFrame>,
    )
    expect(screen.queryByRole('button', { name: /payload/i })).toBeNull()
    rerender(
      <BrowserFrame mode="vulnerable" payload="<img src=x>">
        <div />
      </BrowserFrame>,
    )
    expect(screen.getByRole('button', { name: /payload/i })).toBeInTheDocument()
  })

  it('renders the mode toggle with the current mode selected', () => {
    render(
      <BrowserFrame mode="fixed">
        <div />
      </BrowserFrame>,
    )
    expect(screen.getByText('Исправлено')).toBeInTheDocument()
    expect(screen.getByText('Уязвимо')).toBeInTheDocument()
  })
})
