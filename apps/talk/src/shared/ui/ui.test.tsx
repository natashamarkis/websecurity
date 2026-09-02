import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BadgeTag } from './atoms/BadgeTag'
import { BulletList } from './molecules/BulletList'
import { CodeBlock } from './molecules/CodeBlock'
import { StepTimeline } from './organisms/StepTimeline'

describe('shared/ui wrappers', () => {
  it('BadgeTag renders its text', () => {
    render(<BadgeTag color="red">CWE-79</BadgeTag>)
    expect(screen.getByText('CWE-79')).toBeInTheDocument()
  })

  it('BulletList renders every item', () => {
    render(<BulletList items={['один', 'два', 'три']} />)
    expect(screen.getByText(/один/)).toBeInTheDocument()
    expect(screen.getByText(/два/)).toBeInTheDocument()
    expect(screen.getByText(/три/)).toBeInTheDocument()
  })

  it('CodeBlock renders provided html', () => {
    render(<CodeBlock html="<pre><code>const a = 1</code></pre>" />)
    expect(screen.getByText('const a = 1')).toBeInTheDocument()
  })

  it('StepTimeline renders step titles and texts', () => {
    render(
      <StepTimeline
        steps={[
          { title: 'Шаг 1', text: 'Инъекция' },
          { title: 'Шаг 2', text: 'Кража cookie' },
        ]}
      />,
    )
    expect(screen.getByText('Шаг 1')).toBeInTheDocument()
    expect(screen.getByText('Кража cookie')).toBeInTheDocument()
  })
})
