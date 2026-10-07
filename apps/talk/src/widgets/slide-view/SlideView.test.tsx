import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Slide } from '@ws/slides-schema'
import { SlideView } from './SlideView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/talk/xss/1',
}))

describe('SlideView', () => {
  it('renders a title slide', () => {
    render(<SlideView slide={{ type: 'title', title: 'XSS', subtitle: 'Одна строка' }} />)
    expect(screen.getByText('XSS')).toBeInTheDocument()
    expect(screen.getByText('Одна строка')).toBeInTheDocument()
  })

  it('renders a bullets slide with all items', () => {
    render(<SlideView slide={{ type: 'bullets', title: 'Что', items: ['a', 'b'] }} />)
    expect(screen.getByText('Что')).toBeInTheDocument()
    expect(screen.getByText(/a/)).toBeInTheDocument()
    expect(screen.getByText(/b/)).toBeInTheDocument()
  })

  it('renders a story slide', () => {
    render(<SlideView slide={{ type: 'story', quote: '380 000 карт', source: 'BA 2018' }} />)
    expect(screen.getByText('380 000 карт')).toBeInTheDocument()
    expect(screen.getByText(/BA 2018/)).toBeInTheDocument()
  })

  it('renders two-columns', () => {
    render(
      <SlideView
        slide={{
          type: 'two-columns',
          title: 'До/после',
          left: { title: 'Уязвимо', body: 'innerHTML' },
          right: { title: 'Исправлено', body: 'textContent' },
        }}
      />,
    )
    expect(screen.getByText('Уязвимо')).toBeInTheDocument()
    expect(screen.getByText('textContent')).toBeInTheDocument()
  })

  it('renders a timeline', () => {
    render(
      <SlideView
        slide={{ type: 'timeline', title: 'Хронология', steps: [{ title: 's1', text: 't1' }] }}
      />,
    )
    expect(screen.getByText('s1')).toBeInTheDocument()
  })

  it('renders a checklist', () => {
    render(<SlideView slide={{ type: 'checklist', title: 'Чеклист', items: ['CSP'] }} />)
    expect(screen.getByText('CSP')).toBeInTheDocument()
  })

  it('renders a demo slide with caption and payload', () => {
    render(
      <SlideView
        slide={{
          type: 'demo',
          route: '/site/comments',
          mode: 'vulnerable',
          caption: 'Оставим комментарий',
          payload: '<img src=x>',
        }}
      />,
    )
    expect(screen.getByText('Оставим комментарий')).toBeInTheDocument()
    expect(screen.getByText('<img src=x>')).toBeInTheDocument()
  })

  it('labels backend demos with their actual topic rather than XSS', () => {
    render(<SlideView slide={{ type: 'demo', route: '/site/backend/ssrf', mode: 'vulnerable', caption: 'Импорт каталога' }} />)
    expect(screen.getByText('SSRF / Живая демонстрация')).toBeInTheDocument()
    expect(screen.queryByText(/XSS/)).not.toBeInTheDocument()
    expect(screen.queryByText('Комментарии')).not.toBeInTheDocument()
  })

  it('renders a fallback for an unknown type without crashing', () => {
    const unknown = { type: 'video', src: 'x' } as unknown as Slide
    render(<SlideView slide={unknown} />)
    expect(screen.getByText(/video/)).toBeInTheDocument()
  })
})
