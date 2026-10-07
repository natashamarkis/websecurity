'use client'

import { Typography } from 'antd'

/**
 * УЯЗВИМО: текст пользователя вставляется как HTML.
 * Обработчик события из комментария (например, img onerror) выполняется
 * в браузере посетителя. Это stored XSS.
 */
export function XssInject({ text }: { text: string }) {
  return (
    <Typography.Paragraph>
      <span dangerouslySetInnerHTML={{ __html: text }} />
    </Typography.Paragraph>
  )
}
