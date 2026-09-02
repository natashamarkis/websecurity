import type { ReactNode } from 'react'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { siteTheme } from '@/shared/theme/siteTheme'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { SiteFrame } from '@/widgets/browser-frame/SiteFrame'

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const mode = await getServerMode()
  return (
    <ThemeProvider theme={siteTheme}>
      <SiteFrame mode={mode}>{children}</SiteFrame>
    </ThemeProvider>
  )
}
