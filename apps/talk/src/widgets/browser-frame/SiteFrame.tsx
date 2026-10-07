'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { DemoMode } from '@/shared/lib/demoMode'
import { ViewTransition, DEMO_FRAME_TRANSITION } from '@/shared/lib/viewTransition'
import { BrowserFrame, RETURN_SLIDE_KEY } from './BrowserFrame'
import { readDemoContext, type DemoContext } from '@/features/demo-transition/demoContext'
import { DEPENDENCY_PAYLOAD } from '@/features/vulnerabilities/dependencies/fixtures'

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
  const isDependency = pathname === '/site/product'
  const isThirdParty = pathname === '/site' || pathname === '/site/checkout'
  const isRedirect = pathname === '/site/redirect' || pathname.startsWith('/site/redirect/')
  const module = isCsrf ? 'csrf' : isDependency ? 'dependencies' : isThirdParty ? 'third-party-scripts' : isRedirect ? 'open-redirects' : 'xss'
  const fallback = `/talk/${module}/${module === 'xss' || isRedirect ? 2 : 3}`
  const [returnSlide, setReturnSlide] = useState(fallback)

  useEffect(() => {
    setOrigin(window.location.origin)
    const saved = sessionStorage.getItem(RETURN_SLIDE_KEY)
    setCtx(saved?.startsWith(`/talk/${module}/`) ? readDemoContext() : {})
    setReturnSlide(saved?.startsWith(`/talk/${module}/`) ? saved : fallback)
  }, [pathname, fallback, module])

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
          reloadOnModeChange={isThirdParty}
          payload={isCsrf || isThirdParty || isRedirect ? undefined : ctx.payload ?? (isDependency ? DEPENDENCY_PAYLOAD : '<img src=x onerror=alert(document.cookie)>')}
          returnSlide={returnSlide}
        >
          {children}
        </BrowserFrame>
      </ViewTransition>
    </div>
  )
}
