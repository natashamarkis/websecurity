'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { DemoMode } from '@/shared/lib/demoMode'
import { ViewTransition, DEMO_FRAME_TRANSITION } from '@/shared/lib/viewTransition'
import { BrowserFrame, RETURN_SLIDE_KEY } from './BrowserFrame'
import { readDemoContext, type DemoContext } from '@/features/demo-transition/demoContext'

interface SiteFrameProps {
  mode: DemoMode
  children: ReactNode
}

/**
 * Клиентская оболочка демо-сайта: считает URL из location, подтягивает payload
 * из sessionStorage (их положил demo-слайд) и возвращает на слайд по Esc.
 */
export function SiteFrame({ mode, children }: SiteFrameProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [origin, setOrigin] = useState('http://localhost:3000')
  const [ctx, setCtx] = useState<DemoContext>({})
  const isCsrf = pathname === '/site/delivery'
  const fallback = isCsrf ? '/talk/csrf/2' : '/talk/xss/2'
  const [returnSlide, setReturnSlide] = useState(fallback)

  useEffect(() => {
    setOrigin(window.location.origin)
    setCtx(readDemoContext())
    const saved = sessionStorage.getItem(RETURN_SLIDE_KEY)
    const module = isCsrf ? 'csrf' : 'xss'
    setReturnSlide(saved?.startsWith(`/talk/${module}/`) ? saved : fallback)
  }, [pathname, fallback, isCsrf])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      router.push(returnSlide)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router, returnSlide])

  return (
    <div className="site-frame">
      <ViewTransition name={DEMO_FRAME_TRANSITION}>
        <BrowserFrame
          url={`${origin}${pathname}`}
          mode={mode}
          payload={isCsrf ? undefined : ctx.payload ?? '<img src=x onerror=alert(document.cookie)>'}
          returnSlide={returnSlide}
        >
          {children}
        </BrowserFrame>
      </ViewTransition>
    </div>
  )
}
