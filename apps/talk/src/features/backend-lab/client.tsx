'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Alert, Tag } from 'antd'
import type { DemoMode } from '@/shared/lib/demoMode'

export interface Reply { status: number; message: string }

export function useBackendDemo<T extends Reply>(topic: string, mode: DemoMode) {
  const [result, setResult] = useState<T | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [requestText, setRequestText] = useState('')
  const active = useRef<AbortController | null>(null)
  const call = useCallback(async (input: object) => {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    setRequestText(JSON.stringify(input, null, 2))
    try {
      const response = await fetch(`/api/site/backend/${topic}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input), signal: controller.signal,
      })
      const value = await response.json() as T
      if (!controller.signal.aborted) setResult({ ...value, status: response.status })
      return controller.signal.aborted ? null : value
    } catch {
      if (!controller.signal.aborted) { setResult(null); setError('Сервер недоступен. Повторите запрос.') }
      return null
    } finally {
      if (active.current === controller) setBusy(false)
    }
  }, [topic])
  useEffect(() => {
    const reset = () => { setResult(null); void call({ action: 'reset' }) }
    reset()
    window.addEventListener('demo:reset', reset)
    return () => { active.current?.abort(); window.removeEventListener('demo:reset', reset) }
  }, [call, mode])
  return { result, busy, error, requestText, call }
}

export function BackendLayout({ title, mode, busy, children }: { title: string; mode: DemoMode; busy: boolean; children: ReactNode }) {
  return <div className="backend-demo" data-testid="backend-demo" data-mode={mode} aria-busy={busy}>
    <div className="backend-heading"><h2>{title}</h2><Tag color="cyan">Бэкенд · Node.js</Tag></div>
    {children}
  </div>
}

export function ServerResult({ result, error, requestText, children }: { result: Reply | null; error: string; requestText: string; children?: ReactNode }) {
  return <section className="backend-result" aria-label="Ответ сервера" aria-live="polite">
    <h3>Ответ сервера</h3>
    {error && <Alert type="error" title={error} showIcon />}
    {result && <Alert type={result.status >= 400 ? 'warning' : 'success'} title={`HTTP ${result.status}: ${result.message}`} showIcon />}
    {children}
    <details className="backend-request"><summary>Запрос от фронта · POST JSON</summary><pre>{requestText}</pre></details>
  </section>
}
