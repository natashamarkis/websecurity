'use client'

import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Input, Radio, Tag, Typography } from 'antd'
import { ShoppingCartOutlined } from '@ant-design/icons'
import type { DemoMode } from '@/shared/lib/demoMode'
import demoData from './demo-data.json'
import { createSupportChatScript } from './create-support-chat-script'
import { fixedCreateSupportChatScript } from './fixed-create-support-chat-script'

type Variant = 'original' | 'compromised'
type Status = 'loading' | 'loaded' | 'failed'

export function ThirdPartyScriptsDemo({ mode, thirdPartyPort, page }: { mode: DemoMode; thirdPartyPort: number; page: 'home' | 'checkout' }) {
  const [origin, setOrigin] = useState('')
  const [variant, setVariant] = useState<Variant>('compromised')
  const [revision, setRevision] = useState(0)
  const [status, setStatus] = useState<Status>('loading')
  const [pending, setPending] = useState(true)
  const [captured, setCaptured] = useState<typeof demoData | null>(null)
  const [ordered, setOrdered] = useState(false)
  const [error, setError] = useState('')
  const chatRoot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = new URL(window.location.origin)
    url.port = String(thirdPartyPort)
    setOrigin(url.origin)
    const reset = () => setRevision((value) => value + 1)
    window.addEventListener('demo:reset', reset)
    return () => window.removeEventListener('demo:reset', reset)
  }, [thirdPartyPort])

  useEffect(() => {
    if (!origin || !chatRoot.current) return
    const root = chatRoot.current
    const run = crypto.randomUUID()
    const controller = new AbortController()
    root.dataset.run = run
    setCaptured(null)
    setError('')
    setOrdered(false)
    setPending(true)
    setStatus('loading')
    const src = `${origin}/third-party/support-chat.js?variant=${variant}`
    const script = mode === 'vulnerable'
      ? createSupportChatScript(src)
      : fixedCreateSupportChatScript(src)

    const finish = async (nextStatus: Status) => {
      if (controller.signal.aborted) return
      setStatus(nextStatus)
      try {
        // Загрузка скрипта завершается раньше отправленного им запроса.
        for (let index = 0; index < (nextStatus === 'loaded' ? 10 : 1); index++) {
          const response = await fetch(`${origin}/third-party/captures?run=${run}`, { credentials: 'omit', signal: controller.signal })
          if (!response.ok) throw new Error('Collector unavailable')
          const result: { data: typeof demoData | null } = await response.json()
          if (controller.signal.aborted) return
          setCaptured(result.data)
          if (result.data || nextStatus !== 'loaded') break
          await new Promise((resolve) => setTimeout(resolve, 150))
          if (controller.signal.aborted) return
        }
      } catch {
        if (!controller.signal.aborted) setError('Не удалось проверить локальный получатель. Убедитесь, что сервер на порту ' + thirdPartyPort + ' запущен.')
      } finally {
        if (!controller.signal.aborted) setPending(false)
      }
    }
    script.dataset.run = run
    script.onload = () => { void finish('loaded') }
    script.onerror = () => { void finish('failed') }
    document.body.append(script)
    return () => {
      controller.abort()
      delete root.dataset.run
      root.replaceChildren()
      script.onload = null
      script.onerror = null
      script.remove()
    }
  }, [origin, mode, thirdPartyPort, variant, revision])

  return <div className="checkout-layout">
    <section className="checkout-form" aria-label={page === 'home' ? 'Профиль покупателя' : 'Оформление заказа'}>
      <Typography.Title level={3}>{page === 'home' ? 'Привет, Алекс!' : 'Оформление заказа'}</Typography.Title>
      <Tag>Учебные данные · без оплаты</Tag>
      <img className="checkout-catalog" src="/presentation/catalog.png" alt="Каталог электротехнической продукции" width={420} height={227} />
      <form id="customer-profile" onSubmit={(event) => { event.preventDefault(); if (page === 'checkout') setOrdered(true) }}>
        <label htmlFor="checkout-email">Email покупателя</label>
        <Input id="checkout-email" name="email" value={demoData.email} readOnly />
        <label htmlFor="checkout-address">Адрес доставки</label>
        <Input id="checkout-address" name="address" value={demoData.address} readOnly />
        {page === 'checkout'
          ? <Button type="primary" htmlType="submit" icon={<ShoppingCartOutlined />}>Оформить заказ</Button>
          : <Button type="primary" href="/site/checkout" icon={<ShoppingCartOutlined />}>К оформлению заказа</Button>}
      </form>
      {ordered && <Alert type="success" showIcon title="Учебный заказ оформлен" />}
    </section>
    <section className="checkout-monitor" aria-label="Внешний чат">
      <Typography.Title level={3}>Чат от внешнего поставщика</Typography.Title>
      <Typography.Text code>support-chat.js</Typography.Text>
      <Radio.Group aria-label="Файл поставщика" value={variant} disabled={pending} onChange={(event) => setVariant(event.target.value as Variant)} options={[{ label: 'Подменённый', value: 'compromised' }, { label: 'Исходный', value: 'original' }]} optionType="button" />
      <div id="support-chat-root" ref={chatRoot} />
      <dl className="checkout-details">
        <dt>Сервер поставщика</dt><dd>{origin || '...'}</dd>
        <dt>Проверка SRI</dt><dd><Tag color={mode === 'fixed' ? 'green' : 'orange'}>{mode === 'fixed' ? 'Включена' : 'Отсутствует'}</Tag></dd>
        <dt>Скрипт</dt><dd data-testid="script-status">{{ loading: 'Загрузка', loaded: 'Чат загружен', failed: 'Скрипт не выполнен' }[status]}</dd>
      </dl>
      {status === 'failed' && <Alert type="warning" showIcon title="Загрузка скрипта отклонена" description="Файл не прошёл проверку или недоступен. Точная причина указана в консоли браузера." />}
      {error && <Alert type="error" showIcon title={error} role="alert" />}
      <div className="checkout-capture" aria-live="polite">
        <Typography.Title level={4}>Что получил атакующий</Typography.Title>
        {captured ? <>
          <Tag color="red">Получены данные покупателя</Tag>
          <pre data-testid="captured-data">{JSON.stringify(captured, null, 2)}</pre>
        </> : <Typography.Paragraph data-testid="capture-empty">{pending ? 'Проверяем запросы...' : 'Данных этого запуска нет'}</Typography.Paragraph>}
      </div>
    </section>
  </div>
}
