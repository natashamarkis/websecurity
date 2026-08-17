import type { ThemeConfig } from 'antd';

/**
 * ETM / iPRO OneTeam design tokens — воспроизведены из реальной дизайн-системы
 * @etm/oneteam-core-ui (src/styles/_colors.scss, _font.scss, _spacing.scss,
 * ui/index.theme.ts). Значения точные — так внешний вид совпадает с продуктом.
 */
const t = {
  // --- palette ---
  primary: '#0260e8', // $blue3 / $primary_blue
  primaryHover: '#0254cb', // $blue2
  brandBlue: '#034da2', // $blue1
  dark: '#21283a', // $dark — шапка и сайдбар
  white: '#ffffff',
  whiteHover: 'rgba(255,255,255,0.1)',
  whiteHover20: 'rgba(255,255,255,0.2)',
  backgroundBlue: '#ddebff', // $blue4 — выделения, hover
  infoBackground: '#e6f7ff', // $blue5
  gray1: '#eff2f6', // фон, alt-строки таблиц
  gray2: '#e8ecf3', // светлые линии
  gray3: '#d8dee9', // линии
  gray4: '#adbace', // вторичный текст/границы
  gray5: '#8994a9',
  gray6: '#79859e', // secondary text
  error: '#eb5757',
  errorHover: '#ee6d6d',
  errorBg: '#fae4e1',
  success: '#219653',
  successBg: '#dff4e8',
  warning: '#f2994a',
  warningBg: '#faf3e1',
  appoint: '#f6c327',
  boxShadow: '0px 12px 28px 0px #0020331f, 0px 8px 8px 0px #0020330a',
  boxShadowSecondary: '0px 4px 10px 0px #8994a980',
  // --- type ---
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Roboto', 'Segoe UI', sans-serif",
  fontSizeBody: 16,
  fontSizeSmall: 14,
  fontSizeDescription: 12,
  fontH1: 24,
  fontH2: 20,
  fontH3: 18,
  fontH4: 16,
  fontWeightMedium: 600,
  lineHeightBasic: 1.4,
  lineHeightAntd: 1.5714285714285714,
  lineHeightH2: 1.3,
  // --- spacing / metrics ---
  space3xs: 4,
  spaceXs: 8,
  spaceS: 12,
  spaceM: 16,
  spaceL: 24,
  spaceXl: 32,
  headerHeight: 69,
} as const;

/** Реэкспорт часто используемых значений для инлайновых стилей компонентов. */
export const ETM = {
  primary: t.primary,
  primaryHover: t.primaryHover,
  dark: t.dark,
  white: t.white,
  headerHeight: t.headerHeight,
  backgroundBlue: t.backgroundBlue,
  gray6: t.gray6,
} as const;

export const theme: ThemeConfig = {
  token: {
    colorPrimary: t.primary,
    colorPrimaryHover: t.primaryHover,
    colorPrimaryBorder: t.primary,
    colorPrimaryBorderHover: t.primaryHover,
    colorError: t.error,
    colorErrorHover: t.errorHover,
    colorErrorBg: t.errorBg,
    colorSuccess: t.success,
    colorSuccessBg: t.successBg,
    colorWarning: t.warning,
    colorWarningBg: t.warningBg,
    colorInfo: t.primary,
    colorInfoBg: t.backgroundBlue,
    colorLink: t.primary,
    colorLinkHover: t.primaryHover,
    colorTextBase: t.dark,
    colorText: t.dark,
    colorTextSecondary: t.gray6,
    colorTextTertiary: t.gray4,
    colorTextQuaternary: t.gray3,
    colorTextDisabled: t.gray4,
    colorTextPlaceholder: t.gray4,
    colorFill: t.gray1,
    colorFillSecondary: t.gray1,
    colorFillTertiary: t.gray1,
    colorFillQuaternary: t.gray1,
    colorBorder: t.gray3,
    colorBorderSecondary: t.gray2,
    colorBgLayout: t.white,
    boxShadow: t.boxShadow,
    boxShadowSecondary: t.boxShadowSecondary,
    fontFamily: t.fontFamily,
    fontSize: t.fontSizeBody,
    lineHeight: t.lineHeightBasic,
    fontWeightStrong: t.fontWeightMedium,
    fontSizeHeading1: t.fontH1,
    lineHeightHeading1: t.lineHeightBasic,
    fontSizeHeading2: t.fontH2,
    lineHeightHeading2: t.lineHeightH2,
    fontSizeHeading3: t.fontH3,
    fontSizeHeading4: t.fontH4,
    borderRadius: 5,
    paddingSM: t.spaceXs,
    paddingMD: t.spaceM,
    paddingLG: t.spaceL,
  },
  components: {
    Layout: {
      headerBg: t.dark,
      siderBg: t.dark,
      triggerBg: t.whiteHover,
      headerHeight: t.headerHeight,
      headerPadding: `0 ${t.spaceL}px`,
      bodyBg: t.white,
    },
    Menu: {
      itemBg: t.dark,
      itemColor: t.white,
      itemHoverBg: t.whiteHover,
      itemHoverColor: t.white,
      itemSelectedBg: t.white,
      itemSelectedColor: t.primary,
      subMenuItemBg: t.dark,
      colorBgElevated: t.dark,
      horizontalItemSelectedColor: t.white,
    },
    Button: {
      colorPrimary: t.primary,
      colorBorder: t.primary,
      colorText: t.primary,
      defaultBorderColor: t.primary,
      defaultColor: t.primary,
      defaultHoverBg: t.backgroundBlue,
      defaultHoverBorderColor: t.primary,
      defaultHoverColor: t.primary,
      fontWeight: t.fontWeightMedium,
      borderRadius: 4,
      contentFontSize: t.fontSizeSmall,
    },
    Table: {
      colorFillAlter: t.gray1,
      colorBorderSecondary: t.gray3,
      colorTextHeading: t.gray6,
      cellFontSize: t.fontSizeSmall,
      fontWeightStrong: 600,
      headerBg: t.white,
      headerSortActiveBg: t.white,
      headerSortHoverBg: t.gray1,
      headerBorderRadius: 0,
    },
    Input: { inputFontSize: t.fontSizeSmall },
    Select: { fontSize: t.fontSizeSmall, multipleItemBg: t.backgroundBlue },
    DatePicker: { fontSize: t.fontSizeSmall, inputFontSize: t.fontSizeSmall },
    Tag: {
      defaultBg: t.gray1,
      defaultColor: t.dark,
      colorBorder: 'transparent',
    },
    Alert: {
      fontSize: t.fontSizeSmall,
      colorInfoBg: t.infoBackground,
      colorInfoBorder: 'transparent',
      colorWarningBorder: 'transparent',
      colorErrorBorder: 'transparent',
      colorSuccessBorder: 'transparent',
    },
    Tabs: {
      colorPrimary: t.dark,
      colorText: t.gray6,
      colorBorderSecondary: 'transparent',
    },
    Pagination: { itemActiveBg: t.gray1, colorPrimary: t.dark },
    Typography: { colorTextDescription: t.gray6, titleMarginBottom: 0 },
    Card: { colorBorderSecondary: t.gray2 },
    Descriptions: { colorTextTertiary: t.gray6 },
    Modal: { titleFontSize: t.fontH2 },
    Form: { itemMarginBottom: 16, labelFontSize: t.fontSizeSmall },
  },
};
