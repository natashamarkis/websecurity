'use client'

import { useEffect, useState } from 'react'
import { Alert, Button, Input, Select, Spin, Tag, Typography } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import type { DemoMode } from '@/shared/lib/demoMode'
import { CONSTRUCTOR_PAYLOAD, DEFAULT_SETTINGS, MAX_SETTINGS_LENGTH, PROTOTYPE_PAYLOAD, type PollutionResult } from './fixtures'

export function PrototypePollutionDemo({ mode }: { mode: DemoMode }) {
  const [draft, setDraft] = useState(DEFAULT_SETTINGS)
  const [run, setRun] = useState({ input: DEFAULT_SETTINGS, revision: 0 })
  const [result, setResult] = useState<PollutionResult | null>(null)
  const [pending, setPending] = useState(true)
  const [runtimeError, setRuntimeError] = useState('')
  const [preset, setPreset] = useState<string | undefined>('normal')

  useEffect(() => {
    const reset = () => {
      setDraft(DEFAULT_SETTINGS)
      setPreset('normal')
      setRun((previous) => ({ input: DEFAULT_SETTINGS, revision: previous.revision + 1 }))
    }
    window.addEventListener('demo:reset', reset)
    return () => window.removeEventListener('demo:reset', reset)
  }, [])

  useEffect(() => {
    setPending(true)
    setResult(null)
    setRuntimeError('')
    let worker: Worker | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const failed = () => {
      worker?.terminate()
      clearTimeout(timer)
      setPending(false)
      setRuntimeError('Не удалось выполнить импорт. Повторите попытку.')
    }
    try {
      worker = new Worker(new URL('./catalog.worker.ts', import.meta.url))
      worker.onmessage = (event: MessageEvent<PollutionResult>) => {
        setResult(event.data)
        setPending(false)
        worker?.terminate()
        clearTimeout(timer)
      }
      worker.onerror = (event) => { event.preventDefault(); failed() }
      worker.onmessageerror = failed
      timer = setTimeout(failed, 10_000)
      worker.postMessage({ input: run.input, mode })
    } catch { failed() }
    return () => {
      if (worker) { worker.onmessage = null; worker.onerror = null; worker.onmessageerror = null; worker.terminate() }
      clearTimeout(timer)
    }
  }, [mode, run])

  const presets: Record<string, string> = { normal: DEFAULT_SETTINGS, proto: PROTOTYPE_PAYLOAD, constructor: CONSTRUCTOR_PAYLOAD }
  const money = !result ? 'Нет расчёта' : result.deliveryFee === null ? 'Ошибка расчёта' : `${result.deliveryFee} ₽`

  return <div className="pollution-layout" data-testid="prototype-demo" data-mode={mode} aria-busy={pending}>
    <section className="pollution-import" aria-label="Импорт настроек каталога">
      <Typography.Title level={3}>Настройки каталога</Typography.Title>
      <form onSubmit={(event) => { event.preventDefault(); setRun((previous) => ({ input: draft, revision: previous.revision + 1 })) }}>
        <label htmlFor="settings-preset">Входные данные</label>
        <Select id="settings-preset" aria-label="Входные данные" value={preset} disabled={pending} placeholder="Свой JSON" options={[
          { value: 'normal', label: 'Обычные настройки' },
          { value: 'proto', label: 'Payload: __proto__' },
          { value: 'constructor', label: 'Payload: constructor.prototype' },
        ]} onChange={(value) => { setPreset(value); setDraft(presets[value]!) }} />
        <label htmlFor="catalog-settings-json">JSON настроек</label>
        <Input.TextArea id="catalog-settings-json" rows={6} value={draft} maxLength={MAX_SETTINGS_LENGTH} disabled={pending} spellCheck={false} onChange={(event) => { setDraft(event.target.value); setPreset(undefined) }} />
        <Button type="primary" htmlType="submit" icon={<ImportOutlined />} loading={pending}>Импортировать настройки</Button>
      </form>
      <div className="pollution-feedback" aria-live="polite">
        {runtimeError && <Alert type="error" title={runtimeError} showIcon />}
        {result && <Alert type={result.accepted ? 'success' : 'error'} title={result.error ?? 'Настройки импортированы'} showIcon />}
      </div>
    </section>
    <section className="pollution-catalog" aria-label="Каталог и расчёт доставки">
      <Typography.Title level={3}>Электротехническая продукция</Typography.Title>
      <img src="/presentation/catalog.png" alt="Каталог электротехнической продукции" width={420} height={227} />
      <div className="pollution-view" data-testid="catalog-view">
        <Tag>{result?.sort === 'price' ? 'По цене' : 'По названию'}</Tag>
        <Typography.Text type="secondary">На странице: {result?.pageSize ?? 20}</Typography.Text>
      </div>
      <div className="pollution-delivery">
        <Typography.Title level={4}>Предварительная стоимость доставки</Typography.Title>
        <div className="pollution-fee" data-testid="delivery-estimate" aria-live="polite">{pending ? <Spin size="small" /> : money}</div>
        <pre><code>{'const deliveryOptions = {}\n\ndeliveryOptions.deliveryFee ?? 490'}</code></pre>
      </div>
    </section>
    <section className="pollution-inspector" aria-label="Состояние объектов">
      <Typography.Title level={3}>Состояние объектов</Typography.Title>
      <dl>
        <div><dt>Object.prototype.deliveryFee после JSON.parse</dt><dd data-testid="after-parse">{result?.afterParse ?? '…'}</dd></div>
        <div><dt>Object.prototype.deliveryFee после импорта</dt><dd data-testid="prototype-fee">{result?.prototypeFee ?? '…'}</dd></div>
        <div><dt>Новый объект: {'({}).deliveryFee'}</dt><dd data-testid="new-object-fee">{result?.newObjectFee ?? '…'}</dd></div>
        <div><dt>Собственное поле: Object.hasOwn({'{}'}, 'deliveryFee')</dt><dd data-testid="has-own-fee">{result ? String(result.hasOwnFee) : '…'}</dd></div>
      </dl>
    </section>
  </div>
}
