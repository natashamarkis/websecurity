import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrototypePollutionDemo } from './PrototypePollutionDemo'
import { DEFAULT_SETTINGS, type PollutionResult } from './fixtures'

class DemoWorker {
  static instances: DemoWorker[] = []
  onmessage: ((event: { data: PollutionResult }) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  onmessageerror: (() => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() { DemoWorker.instances.push(this) }
}

const success: PollutionResult = {
  accepted: true, error: null, sort: 'price', pageSize: 20,
  afterParse: 'undefined', prototypeFee: 'undefined', newObjectFee: 'undefined',
  hasOwnFee: false, deliveryFee: 490,
}

beforeEach(() => {
  DemoWorker.instances = []
  vi.stubGlobal('Worker', DemoWorker)
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('isolated worker lifecycle', () => {
  it('replaces the worker on a mode change, terminates after a result and on unmount', () => {
    const view = render(<PrototypePollutionDemo mode="vulnerable" />)
    const first = DemoWorker.instances[0]!
    expect(first.postMessage).toHaveBeenCalledWith({ input: DEFAULT_SETTINGS, mode: 'vulnerable' })
    view.rerender(<PrototypePollutionDemo mode="fixed" />)
    expect(first.terminate).toHaveBeenCalledOnce()
    expect(first.onmessage).toBeNull()
    const fixed = DemoWorker.instances[1]!
    expect(fixed.postMessage).toHaveBeenCalledWith({ input: DEFAULT_SETTINGS, mode: 'fixed' })
    act(() => fixed.onmessage?.({ data: success }))
    expect(fixed.terminate).toHaveBeenCalledOnce()
    expect(screen.getByTestId('delivery-estimate')).toHaveTextContent('490 ₽')
    view.unmount()
    expect(fixed.onmessage).toBeNull()
    expect(fixed.onerror).toBeNull()
  })

  it('terminates a stalled worker, reports no calculation and allows a clean retry', () => {
    vi.useFakeTimers()
    render(<PrototypePollutionDemo mode="vulnerable" />)
    const first = DemoWorker.instances[0]!
    act(() => vi.advanceTimersByTime(10_000))
    expect(first.terminate).toHaveBeenCalledOnce()
    expect(screen.getByText('Не удалось выполнить импорт. Повторите попытку.')).toBeVisible()
    expect(screen.getByTestId('delivery-estimate')).toHaveTextContent('Нет расчёта')
    fireEvent.click(screen.getByRole('button', { name: /Импортировать настройки/ }))
    const retry = DemoWorker.instances[1]!
    act(() => retry.onmessage?.({ data: success }))
    expect(screen.getByTestId('delivery-estimate')).toHaveTextContent('490 ₽')
    expect(screen.queryByText('Не удалось выполнить импорт. Повторите попытку.')).toBeNull()
  })

  it('handles an unavailable Worker without leaving controls stuck', () => {
    vi.stubGlobal('Worker', class { constructor() { throw new Error('Worker unavailable') } })
    render(<PrototypePollutionDemo mode="fixed" />)
    expect(screen.getByText('Не удалось выполнить импорт. Повторите попытку.')).toBeVisible()
    expect(screen.getByLabelText('JSON настроек')).toBeEnabled()
    expect(screen.getByTestId('delivery-estimate')).toHaveTextContent('Нет расчёта')
  })
})
