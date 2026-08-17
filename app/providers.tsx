'use client';

import '@ant-design/v5-patch-for-react-19';

import { App as AntApp, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type { ReactNode } from 'react';

import { theme } from '@/lib/theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={ruRU} theme={theme}>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
