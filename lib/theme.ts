import type { ThemeConfig } from 'antd';

/**
 * ETM / iPRO OneTeam brand palette.
 *
 * ⚠️ Точные фирменные значения живут в приватном пакете @etm/oneteam-core-ui
 * и в исходнике недоступны. Здесь — разумный ETM-синий плейсхолдер.
 * Чтобы попасть в бренд точно, поменяй значения ниже (по скриншоту живого
 * приложения) — antd-тема и SCSS-токены (styles/_tokens.scss) должны
 * оставаться синхронными.
 */
export const ETM = {
  primary: '#0A5AD3',
  primaryHover: '#0847A8',
  primaryActive: '#063A8A',
  link: '#0A5AD3',
  selectedBg: '#E8F1FE',
  selectedText: '#0847A8',
  bgLayout: '#F4F6FA',
  headerBg: '#FFFFFF',
  siderBg: '#FFFFFF',
  border: '#D9D9D9',
} as const;

export const theme: ThemeConfig = {
  token: {
    colorPrimary: ETM.primary,
    colorLink: ETM.link,
    colorInfo: ETM.primary,
    colorError: '#FF4D4F',
    colorSuccess: '#52C41A',
    colorWarning: '#FAAD14',
    colorBorder: ETM.border,
    colorBgLayout: ETM.bgLayout,
    borderRadius: 8,
    fontSize: 14,
    fontFamily:
      "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      headerBg: ETM.headerBg,
      siderBg: ETM.siderBg,
      headerHeight: 56,
      headerPadding: '0 24px',
      bodyBg: ETM.bgLayout,
    },
    Menu: {
      itemSelectedBg: ETM.selectedBg,
      itemSelectedColor: ETM.selectedText,
      itemActiveBg: ETM.selectedBg,
      horizontalItemSelectedColor: ETM.selectedText,
    },
  },
};
