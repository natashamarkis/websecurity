'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nextRoute, prevRoute, type DeckOutline } from './navigation'

interface NavigationControllerProps {
  outline: DeckOutline
  moduleId: string
  index: number
  enabled?: boolean
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || target.isContentEditable
}

/**
 * Хоткеи презентации: → / Space / ← листают, F — fullscreen.
 * Ничего не рендерит. Enter/Esc для демо живут в фиче demo-transition.
 */
export function NavigationController({ outline, moduleId, index, enabled = true }: NavigationControllerProps) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return
    const next = nextRoute(outline, moduleId, index)
    const prev = prevRoute(outline, moduleId, index)
    if (next) router.prefetch(next)
    if (prev) router.prefetch(prev)

    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof HTMLElement && e.target.closest('[role="tablist"], [role="menu"]')) return
      if (e.key === ' ' && e.target instanceof HTMLElement && e.target.closest('button, a')) return
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          if (next) router.push(next)
          e.preventDefault()
          break
        case 'ArrowLeft':
        case 'PageUp':
          if (prev) router.push(prev)
          e.preventDefault()
          break
        case 'f':
        case 'F':
        case 'а':
        case 'А':
          if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
          else void document.documentElement.requestFullscreen?.().catch(() => {})
          break
        default:
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [outline, moduleId, index, router, enabled])

  return null
}
