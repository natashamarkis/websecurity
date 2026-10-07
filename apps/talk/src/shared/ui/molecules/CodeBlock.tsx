'use client'

import { Card } from 'antd'

interface CodeBlockProps {
  /**
   * Готовый HTML от shiki. Источник — файлы нашего репозитория, подсвеченные на сервере
   * при сборке; это доверенный ввод, а не пользовательский. Именно поэтому здесь
   * допустим dangerouslySetInnerHTML (см. модуль XSS: правило про недоверенный ввод).
   */
  html: string
}

/** Обёртка над Card для блока кода с подсветкой. */
export function CodeBlock({ html }: CodeBlockProps) {
  return (
    <Card size="small" styles={{ body: { padding: 0, overflow: 'auto' } }}>
      <div
        style={{ fontSize: 16, lineHeight: 1.5 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Card>
  )
}
