import type { ReactNode } from 'react'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import './globals.css'

export const metadata = {
  title: 'Web Security Tech Talk',
  description: 'Учебная платформа: демонстрация и предотвращение frontend-уязвимостей',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0 }}>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  )
}
