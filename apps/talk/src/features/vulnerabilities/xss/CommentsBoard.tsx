import { Card, Flex } from 'antd'
import { store } from '@/shared/lib/memory-store'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { XssInject } from './XssInject'
import { FixedXssInject } from './FixedXssInject'
import { CommentForm } from './CommentForm'

export async function CommentsBoard() {
  const mode = await getServerMode()
  const vulnerable = mode === 'vulnerable'
  const comments = store.listComments()

  return (
    <Flex vertical gap={16} style={{ maxWidth: 640 }}>
      <CommentForm />
      <Flex vertical gap={12} data-testid="comments-list">
        {comments.map((c) => (
          <Card key={c.id} size="small" title={c.author} data-testid="comment">
            {vulnerable ? <XssInject text={c.text} /> : <FixedXssInject text={c.text} />}
          </Card>
        ))}
      </Flex>
    </Flex>
  )
}
