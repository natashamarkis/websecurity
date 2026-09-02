'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Flex, Input, Tag, Button, Tooltip, App } from 'antd'
import type { DemoMode } from '@/shared/lib/demoMode'
import { DemoModeToggle } from '@/features/demo-mode-toggle/DemoModeToggle'

export const RETURN_SLIDE_KEY = 'talk:return-slide'

interface BrowserFrameProps {
  url: string
  mode: DemoMode
  payload?: string
  evilUrl?: string
  children: ReactNode
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/**
 * «Окно браузера» вокруг демо-сайта: адресная строка, origin, тумблер режима,
 * кнопки payload / evil / сброс / возврат на слайд. Выглядит как часть браузера,
 * а не презентации — так зритель видит границу «слайды ↔ живой сайт».
 */
export function BrowserFrame({ url, mode, payload, evilUrl, children }: BrowserFrameProps) {
  const router = useRouter()
  const { message } = App.useApp()

  const copyPayload = async () => {
    if (!payload) return
    await navigator.clipboard.writeText(payload)
    message.success('Payload скопирован')
  }

  const reset = async () => {
    await fetch('/api/site/reset', { method: 'POST' })
    router.refresh()
    message.info('Данные демо-сайта сброшены')
  }

  const backToSlide = () => {
    const back = sessionStorage.getItem(RETURN_SLIDE_KEY) ?? '/talk'
    router.push(back)
  }

  return (
    <Card
      styles={{ header: { padding: '8px 16px' }, body: { padding: 0 } }}
      title={
        <Flex align="center" gap={12}>
          <Tag color="blue" style={{ margin: 0 }}>
            {hostOf(url)}
          </Tag>
          <Input value={url} readOnly style={{ flex: 1 }} />
          <DemoModeToggle mode={mode} />
          {payload && (
            <Tooltip title={payload}>
              <Button onClick={copyPayload}>Payload</Button>
            </Tooltip>
          )}
          {evilUrl && (
            <Button href={evilUrl} target="_blank" rel="noopener">
              Открыть evil
            </Button>
          )}
          <Button onClick={reset}>Сбросить</Button>
          <Button type="primary" onClick={backToSlide}>
            ← К слайду
          </Button>
        </Flex>
      }
    >
      {children}
    </Card>
  )
}
