'use client'

import { Typography } from 'antd'

/**
 * УЯЗВИМО: текст пользователя вставляется как HTML.
 * Любой <img onerror=...> или <script> из комментария выполнится у каждого,
 * кто откроет страницу. Это stored XSS.
 */
export function CommentBodyVulnerable({ text }: { text: string }) {
  return (
    <Typography.Paragraph>
      <span dangerouslySetInnerHTML={{ __html: text }} />
    </Typography.Paragraph>
  )
}
