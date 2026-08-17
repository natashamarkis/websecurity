import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';

import { Providers } from './providers';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: 'iPRO OneTeam — Security Demo',
  description:
    'Учебное намеренно-уязвимое приложение для демонстрации веб-уязвимостей. Только для локального обучения.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
