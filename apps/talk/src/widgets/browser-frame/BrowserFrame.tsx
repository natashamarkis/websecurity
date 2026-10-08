'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Tooltip, App } from 'antd'
import { ArrowLeftOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import type { DemoMode } from '@/shared/lib/demoMode'
import { DemoModeToggle } from '@/features/demo-mode-toggle/DemoModeToggle'

export const RETURN_SLIDE_KEY = 'talk:return-slide'

interface BrowserFrameProps {
  mode: DemoMode
  reloadOnModeChange?: boolean
  payload?: string
  children: ReactNode
  returnSlide?: string
}

export function BrowserFrame({ mode, reloadOnModeChange = false, payload, children, returnSlide = '/talk/xss/2' }: BrowserFrameProps) {
  const router = useRouter()
  const { message } = App.useApp()
  const copyPayload = async () => {
    if (!payload) return
    try {
      await navigator.clipboard.writeText(payload)
      message.success('Payload скопирован')
    } catch {
      message.error('Не удалось скопировать payload')
    }
  }
  const reset = async () => {
    try {
      const response = await fetch('/api/site/reset', { method: 'POST' })
      if (!response.ok) throw new Error('Reset failed')
      router.refresh()
      window.dispatchEvent(new Event('demo:reset'))
      message.info('Данные демо-сайта сброшены')
    } catch {
      message.error('Не удалось сбросить данные')
    }
  }

  return (
    <section className="browser-frame">
      <div className="browser-toolbar">
        <DemoModeToggle mode={mode} reloadOnChange={reloadOnModeChange} />
        <div className="browser-actions">
          {payload && <Tooltip title="Скопировать payload"><Button aria-label="Скопировать payload" icon={<CopyOutlined />} onClick={copyPayload} /></Tooltip>}
          <Tooltip title="Сбросить данные"><Button aria-label="Сбросить" icon={<ReloadOutlined />} onClick={reset} /></Tooltip>
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.push(returnSlide)}>К слайду</Button>
        </div>
      </div>
      {children}
    </section>
  )
}
