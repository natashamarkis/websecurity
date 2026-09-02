import { Card, Flex } from 'antd'
import { store } from '@/shared/lib/memory-store'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { pick } from '@/shared/lib/demoMode'
import { CommentBodyVulnerable } from './render.vulnerable'
import { CommentBodyFixed } from './render.fixed'
import { CommentForm } from './CommentForm'

/**
 * Серверный список комментариев. Единственная точка выбора реализации —
 * pick(): по cookie demo-mode берём уязвимый или исправленный рендер тела.
 */
export async function CommentsBoard() {
  const mode = await getServerMode()
  const CommentBody = pick(CommentBodyVulnerable, CommentBodyFixed, mode)
  const comments = store.listComments()

  return (
    <Flex vertical gap={16} style={{ maxWidth: 640 }}>
      <CommentForm />
      <Flex vertical gap={12} data-testid="comments-list">
        {comments.map((c) => (
          <Card key={c.id} size="small" title={c.author} data-testid="comment">
            <CommentBody text={c.text} />
          </Card>
        ))}
      </Flex>
    </Flex>
  )
}
