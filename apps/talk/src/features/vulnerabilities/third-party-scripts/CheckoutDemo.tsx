'use client'

import { useEffect, useState } from 'react'
import { Alert, Button, Input, Radio, Tag, Typography } from 'antd'
import { ShoppingCartOutlined } from '@ant-design/icons'
import type { DemoMode } from '@/shared/lib/demoMode'
import demoData from './demo-data.json'
import { createAnalyticsScript } from './create-analytics-script'
import { fixedCreateAnalyticsScript } from './fixed-create-analytics-script'

type Variant = 'original' | 'compromised'
type Status = 'idle' | 'loading' | 'loaded' | 'blocked'

export function CheckoutDemo({ mode, thirdPartyPort }: { mode: DemoMode; thirdPartyPort: number }) {
  const [origin, setOrigin] = useState('')
  const [variant, setVariant] = useState<Variant>('compromised')
  const [attempt, setAttempt] = useState<{ run: string; variant: Variant } | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [pending, setPending] = useState(false)
  const [captured, setCaptured] = useState<typeof demoData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const url = new URL(window.location.origin)
    url.port = String(thirdPartyPort)
    setOrigin(url.origin)
    const reset = () => {
      setAttempt(null)
      setStatus('idle')
      setCaptured(null)
      setPending(false)
      setError('')
    }
    window.addEventListener('demo:reset', reset)
    return () => window.removeEventListener('demo:reset', reset)
  }, [thirdPartyPort])

  useEffect(() => {
    if (!attempt || !origin) return
    const controller = new AbortController()
    const src = `${origin}/third-party/checkout-analytics.js?variant=${attempt.variant}`
    const script = mode === 'vulnerable' ? createAnalyticsScript(src) : fixedCreateAnalyticsScript(src)
    script.dataset.run = attempt.run
    const finish = async (loaded: boolean) => {
      if (controller.signal.aborted) return
      setStatus(loaded ? 'loaded' : 'blocked')
      try {
        // Загрузка скрипта завершается раньше отправленного им запроса.
        for (let index = 0; index < (loaded ? 10 : 1); index++) {
          const response = await fetch(`${origin}/third-party/captures?run=${attempt.run}`, { credentials: 'omit', signal: controller.signal })
          if (!response.ok) throw new Error('Collector unavailable')
          const result: { data: typeof demoData | null } = await response.json()
          if (controller.signal.aborted) return
          setCaptured(result.data)
          if (result.data || !loaded) break
          await new Promise((resolve) => setTimeout(resolve, 150))
          if (controller.signal.aborted) return
        }
      } catch {
        if (!controller.signal.aborted) setError('Не удалось проверить локальный получатель. Убедитесь, что сервер на порту ' + thirdPartyPort + ' запущен.')
      } finally {
        if (!controller.signal.aborted) setPending(false)
      }
    }
    script.onload = () => { void finish(true) }
    script.onerror = () => { void finish(false) }
    document.body.append(script)
    return () => {
      controller.abort()
      script.onload = null
      script.onerror = null
      script.remove()
    }
  }, [attempt, origin, mode, thirdPartyPort])

  return <div className="checkout-layout">
    <section className="checkout-form" aria-label="Оформление заказа">
      <Typography.Title level={3}>Оформление заказа</Typography.Title>
      <Tag>Учебные данные · без оплаты</Tag>
      <img className="checkout-catalog" src="/presentation/catalog.png" alt="Каталог электротехнической продукции" width={420} height={227} />
      <form id="checkout-form" onSubmit={(event) => {
        event.preventDefault()
        setCaptured(null)
        setError('')
        setStatus('loading')
        setPending(true)
        setAttempt({ run: crypto.randomUUID(), variant })
      }}>
        <label htmlFor="checkout-email">Email покупателя</label>
        <Input id="checkout-email" name="email" value={demoData.email} readOnly />
        <label htmlFor="checkout-address">Адрес доставки</label>
        <Input id="checkout-address" name="address" value={demoData.address} readOnly />
        <Button type="primary" htmlType="submit" icon={<ShoppingCartOutlined />} loading={pending} disabled={!origin}>Оформить заказ</Button>
      </form>
    </section>
    <section className="checkout-monitor" aria-label="Сторонняя аналитика">
      <Typography.Title level={3}>Сторонняя аналитика</Typography.Title>
      <Typography.Text code>checkout-analytics.js</Typography.Text>
      <Radio.Group aria-label="Файл на CDN" value={variant} disabled={pending} onChange={(event) => {
        setVariant(event.target.value as Variant)
        setAttempt(null)
        setStatus('idle')
        setCaptured(null)
        setError('')
      }} options={[{ label: 'Подменённый', value: 'compromised' }, { label: 'Исходный', value: 'original' }]} optionType="button" />
      <dl className="checkout-details">
        <dt>CDN и получатель</dt><dd>{origin || '...'}</dd>
        <dt>Проверка SRI</dt><dd><Tag color={mode === 'fixed' ? 'green' : 'orange'}>{mode === 'fixed' ? 'Включена' : 'Отсутствует'}</Tag></dd>
        <dt>Скрипт</dt><dd data-testid="script-status">{{ idle: 'Ещё не загружен', loading: 'Загрузка', loaded: 'Выполнен', blocked: 'Браузер отклонил загрузку' }[status]}</dd>
        <dt>Событие аналитики</dt><dd><output id="checkout-analytics" data-testid="analytics-event" key={attempt?.run ?? 'idle'}>Нет события</output></dd>
      </dl>
      {status === 'blocked' && <Alert type="warning" showIcon title="Скрипт не выполнен" description="При подмене файла SRI блокирует выполнение. Ошибку загрузки также может вызвать недоступность CDN." />}
      {error && <Alert type="error" showIcon title={error} role="alert" />}
      <div className="checkout-capture" aria-live="polite">
        <Typography.Title level={4}>На стороне получателя</Typography.Title>
        {captured ? <>
          <Tag color="red">Получены поля формы</Tag>
          <pre data-testid="captured-data">{JSON.stringify(captured, null, 2)}</pre>
        </> : <Typography.Paragraph data-testid="capture-empty">{pending ? 'Проверяем запросы...' : 'Данных этого запуска нет'}</Typography.Paragraph>}
      </div>
    </section>
  </div>
}
