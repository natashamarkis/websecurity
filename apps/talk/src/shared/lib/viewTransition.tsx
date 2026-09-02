'use client'

import * as React from 'react'
import type { ReactNode } from 'react'

interface ViewTransitionProps {
  name?: string
  children: ReactNode
}

type VTComponent = React.ComponentType<{ name?: string; children?: ReactNode }>

/**
 * React 19.2 ViewTransition (Next 16 включает его в canary-сборке React).
 * Типы @types/react могут отставать, поэтому берём через индекс с фолбэком на Fragment.
 */
const ReactVT = (React as unknown as { ViewTransition?: VTComponent }).ViewTransition

export function ViewTransition({ name, children }: ViewTransitionProps) {
  if (!ReactVT) return <>{children}</>
  return <ReactVT name={name}>{children}</ReactVT>
}

/** Общее имя для морфа «карточка demo-слайда → окно браузера». */
export const DEMO_FRAME_TRANSITION = 'demo-frame'
