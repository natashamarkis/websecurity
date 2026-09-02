import type { ReactNode } from 'react'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { siteTheme } from '@/shared/theme/siteTheme'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={siteTheme}>{children}</ThemeProvider>
}
