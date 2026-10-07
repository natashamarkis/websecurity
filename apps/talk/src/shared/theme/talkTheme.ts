import { theme, type ThemeConfig } from 'antd'

/** Palette and typography from Cybersecurity.pptx. */
export const talkTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#05358c',
    colorInfo: '#05358c',
    colorSuccess: '#008697',
    colorWarning: '#ed9a29',
    colorText: '#232b37',
    colorTextHeading: '#05358c',
    colorTextSecondary: '#647084',
    colorBgLayout: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBorder: '#dce3ed',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 16,
    borderRadius: 4,
    controlHeight: 40,
  },
  components: {
    Timeline: { dotSize: 28 },
    Steps: { dotSize: 28, dotCurrentSize: 28 },
    Typography: { titleMarginBottom: '0.65em', titleMarginTop: '0' },
    Button: { primaryShadow: 'none' },
  },
}
