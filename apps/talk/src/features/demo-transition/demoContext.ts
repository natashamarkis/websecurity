import { RETURN_SLIDE_KEY } from '@/widgets/browser-frame/BrowserFrame'

export const DEMO_CONTEXT_KEY = 'talk:demo-context'

export interface DemoContext {
  payload?: string
}

/** Что demo-слайд передаёт рамке браузера через sessionStorage (сервер об этом знать не должен). */
export function saveDemoContext(returnPath: string, ctx: DemoContext): void {
  sessionStorage.setItem(RETURN_SLIDE_KEY, returnPath)
  sessionStorage.setItem(DEMO_CONTEXT_KEY, JSON.stringify(ctx))
}

export function readDemoContext(): DemoContext {
  try {
    return JSON.parse(sessionStorage.getItem(DEMO_CONTEXT_KEY) ?? '{}') as DemoContext
  } catch {
    return {}
  }
}
