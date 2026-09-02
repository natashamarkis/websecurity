import type { ReactNode } from 'react'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { talkTheme } from '@/shared/theme/talkTheme'

export default function TalkLayout({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={talkTheme}>{children}</ThemeProvider>
}
