'use client'

import { Typography } from 'antd'

/**
 * ИСПРАВЛЕНО: текст пользователя выводится как текст.
 * React экранирует его автоматически — тот же payload просто печатается.
 * Правило: недоверенный ввод никогда не попадает в innerHTML.
 */
export function FixedXssInject({ text }: { text: string }) {
  return <Typography.Paragraph>{text}</Typography.Paragraph>
}
