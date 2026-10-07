import { theme, type ThemeConfig } from 'antd'

/**
 * Тема презентации: тёмный фон, крупная типографика, заметный акцент.
 * Меняем внешний вид только через токены antd — никаких кастомных стилей.
 */
export const talkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#7c5cff',
    fontSize: 18,
    borderRadius: 12,
    colorBgLayout: '#0b0b12',
  },
  components: {
    Typography: {
      titleMarginBottom: '0.4em',
      titleMarginTop: '0',
    },
  },
}
