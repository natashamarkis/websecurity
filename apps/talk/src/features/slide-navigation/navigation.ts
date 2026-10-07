export interface DeckOutlineItem {
  id: string
  slideCount: number
}

/** Порядок модулей и число слайдов в каждом — всё, что нужно для навигации. */
export type DeckOutline = DeckOutlineItem[]

export function slideRoute(moduleId: string, index: number): string {
  return `/talk/${moduleId}/${index}`
}

export function nextRoute(outline: DeckOutline, moduleId: string, index: number): string | null {
  const pos = outline.findIndex((m) => m.id === moduleId)
  if (pos === -1) return null
  const current = outline[pos]!
  if (index + 1 < current.slideCount) return slideRoute(moduleId, index + 1)
  const next = outline[pos + 1]
  return next ? slideRoute(next.id, 0) : null
}

export function prevRoute(outline: DeckOutline, moduleId: string, index: number): string | null {
  const pos = outline.findIndex((m) => m.id === moduleId)
  if (pos === -1) return null
  if (index > 0) return slideRoute(moduleId, index - 1)
  const prev = outline[pos - 1]
  return prev ? slideRoute(prev.id, prev.slideCount - 1) : null
}
