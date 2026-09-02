import { theme, type ThemeConfig } from 'antd'

/**
 * Тема демо-сайта: светлая «продуктовая», обычные размеры.
 * Визуально контрастирует с презентацией, чтобы зритель понимал:
 * это отдельный «живой» сайт, а не слайд.
 */
export const siteTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
  },
}
