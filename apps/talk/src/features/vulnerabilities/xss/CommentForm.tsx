'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Flex, Input } from 'antd'

/** POST в API, затем перерисовка серверного списка комментариев. */
export function CommentForm() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!text.trim()) return
    startTransition(async () => {
      await fetch('/api/site/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      setText('')
      router.refresh()
    })
  }

  return (
    <Flex vertical gap={8} style={{ maxWidth: 640 }}>
      <Input.TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Оставьте комментарий…"
        autoSize={{ minRows: 2, maxRows: 5 }}
        data-testid="comment-input"
      />
      <Flex justify="flex-end">
        <Button type="primary" onClick={submit} loading={pending} data-testid="comment-submit">
          Отправить
        </Button>
      </Flex>
    </Flex>
  )
}
