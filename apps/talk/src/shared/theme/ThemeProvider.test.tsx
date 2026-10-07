import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from 'antd'
import { ThemeProvider } from './ThemeProvider'
import { talkTheme } from './talkTheme'
import { siteTheme } from './siteTheme'

describe('ThemeProvider', () => {
  it('renders antd children under talk theme', () => {
    render(
      <ThemeProvider theme={talkTheme}>
        <Button>Далее</Button>
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: 'Далее' })).toBeInTheDocument()
  })

  it('renders antd children under site theme', () => {
    render(
      <ThemeProvider theme={siteTheme}>
        <Button>Войти</Button>
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument()
  })
})
