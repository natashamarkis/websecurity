import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserFrame } from './BrowserFrame'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

describe('BrowserFrame', () => {
  it('shows url, origin badge, toolbar buttons and children', () => {
    render(
      <BrowserFrame url="http://localhost:3000/site/comments" mode="vulnerable">
        <div>site body</div>
      </BrowserFrame>,
    )
    expect(screen.getByDisplayValue('http://localhost:3000/site/comments')).toBeInTheDocument()
    expect(screen.getByText('localhost:3000')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /к слайду/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /сбросить/i })).toBeInTheDocument()
    expect(screen.getByText('site body')).toBeInTheDocument()
  })

  it('shows the payload button only when a payload is given', () => {
    const { rerender } = render(
      <BrowserFrame url="http://localhost:3000/site" mode="vulnerable">
        <div />
      </BrowserFrame>,
    )
    expect(screen.queryByRole('button', { name: /payload/i })).toBeNull()
    rerender(
      <BrowserFrame url="http://localhost:3000/site" mode="vulnerable" payload="<img src=x>">
        <div />
      </BrowserFrame>,
    )
    expect(screen.getByRole('button', { name: /payload/i })).toBeInTheDocument()
  })

  it('renders the mode toggle with the current mode selected', () => {
    render(
      <BrowserFrame url="http://localhost:3000/site" mode="fixed">
        <div />
      </BrowserFrame>,
    )
    expect(screen.getByText('Исправлено')).toBeInTheDocument()
    expect(screen.getByText('Уязвимо')).toBeInTheDocument()
  })
})
