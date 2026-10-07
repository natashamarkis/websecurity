import { talkTheme } from './talkTheme'
import type { ThemeConfig } from 'antd'

export const siteTheme: ThemeConfig = {
  ...talkTheme,
  token: { ...talkTheme.token, fontSize: 14, colorBgLayout: '#f4f6fa' },
}
