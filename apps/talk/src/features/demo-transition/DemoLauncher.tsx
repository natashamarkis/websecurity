'use client'

import { useEffect, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from 'antd'
import type { DemoMode } from '@/shared/lib/demoMode'
import { setDemoMode } from '@/features/demo-mode-toggle/DemoModeToggle'
import { saveDemoContext } from './demoContext'

interface DemoLauncherProps {
  route: string
  mode: DemoMode
  payload?: string
  evilPage?: string
}

/** Кнопка «Показать» + Enter: ставит режим, запоминает слайд для возврата и уходит на демо-сайт. */
export function DemoLauncher({ route, mode, payload, evilPage }: DemoLauncherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const launch = () => {
    saveDemoContext(pathname, { payload, evilPage })
    startTransition(async () => {
      await setDemoMode(mode)
      router.push(route)
    })
  }

  useEffect(() => {
    router.prefetch(route)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        launch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // launch читает актуальные props через замыкание, пересоздаём на смене route/mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, mode, payload, evilPage, pathname])

  return (
    <Button type="primary" size="large" loading={pending} onClick={launch}>
      Показать (Enter)
    </Button>
  )
}
