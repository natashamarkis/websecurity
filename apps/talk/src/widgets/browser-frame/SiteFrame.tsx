'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { DemoMode } from '@/shared/lib/demoMode'
import { ViewTransition, DEMO_FRAME_TRANSITION } from '@/shared/lib/viewTransition'
import { BrowserFrame, RETURN_SLIDE_KEY } from './BrowserFrame'
import { readDemoContext, evilUrlFor, type DemoContext } from '@/features/demo-transition/demoContext'

interface SiteFrameProps {
  mode: DemoMode
  children: ReactNode
}

/**
 * Клиентская оболочка демо-сайта: считает URL из location, подтягивает payload/evil
 * из sessionStorage (их положил demo-слайд) и возвращает на слайд по Esc.
 */
export function SiteFrame({ mode, children }: SiteFrameProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [origin, setOrigin] = useState('http://localhost:3000')
  const [ctx, setCtx] = useState<DemoContext>({})

  useEffect(() => {
    setOrigin(window.location.origin)
    setCtx(readDemoContext())
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      router.push(sessionStorage.getItem(RETURN_SLIDE_KEY) ?? '/talk')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  return (
    <div style={{ minHeight: '100vh', padding: 16, background: '#0b0b12' }}>
      <ViewTransition name={DEMO_FRAME_TRANSITION}>
        <BrowserFrame
          url={`${origin}${pathname}`}
          mode={mode}
          payload={ctx.payload}
          evilUrl={evilUrlFor(ctx.evilPage)}
        >
          {children}
        </BrowserFrame>
      </ViewTransition>
    </div>
  )
}
