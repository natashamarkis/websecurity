'use client'

import { useCallback, useEffect, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import type { DemoMode } from '@/shared/lib/demoMode'
import { setDemoMode } from '@/features/demo-mode-toggle/DemoModeToggle'
import { saveDemoContext } from './demoContext'

interface DemoLauncherProps {
  route: string
  mode: DemoMode
  payload?: string
}

/** Кнопка «Показать» + Enter: ставит режим, запоминает слайд для возврата и уходит на демо-сайт. */
export function DemoLauncher({ route, mode, payload }: DemoLauncherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const launch = useCallback(() => {
    saveDemoContext(pathname, { payload })
    startTransition(async () => {
      await setDemoMode(mode)
      router.push(route)
    })
  }, [pathname, payload, mode, route, router])

  useEffect(() => {
    router.prefetch(route)
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('[role="dialog"], input, textarea, button, a, [contenteditable="true"]')) return
      if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        launch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [route, router, launch])

  return (
    <Button type="primary" size="large" icon={<PlayCircleOutlined />} loading={pending} onClick={launch}>
      Открыть демонстрацию
    </Button>
  )
}
