'use client'

import type { ReactNode } from 'react'
import { ConfigProvider, type ThemeConfig } from 'antd'
import ruRU from 'antd/locale/ru_RU'

interface ThemeProviderProps {
  theme: ThemeConfig
  children: ReactNode
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  return (
    <ConfigProvider theme={theme} locale={ruRU}>
      {children}
    </ConfigProvider>
  )
}
