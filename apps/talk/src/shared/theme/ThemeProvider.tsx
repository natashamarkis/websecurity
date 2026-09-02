'use client'

import type { ReactNode } from 'react'
import { ConfigProvider, App, type ThemeConfig } from 'antd'
import ruRU from 'antd/locale/ru_RU'

interface ThemeProviderProps {
  theme: ThemeConfig
  children: ReactNode
}

/** ConfigProvider + App: App нужен, чтобы message/notification брали цвета из темы. */
export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  return (
    <ConfigProvider theme={theme} locale={ruRU}>
      <App>{children}</App>
    </ConfigProvider>
  )
}
