'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Select, Typography } from 'antd'
import { ArrowRightOutlined, MailOutlined } from '@ant-design/icons'
import { demoDestinations } from './destinations'

export function OpenRedirectDemo({ attackerPort }: { attackerPort: number }) {
  const [origin, setOrigin] = useState('')
  const [next, setNext] = useState('')

  useEffect(() => {
    const currentOrigin = window.location.origin
    setOrigin(currentOrigin)
    const reset = () => setNext(demoDestinations(currentOrigin, attackerPort).external)
    reset()
    window.addEventListener('demo:reset', reset)
    return () => window.removeEventListener('demo:reset', reset)
  }, [attackerPort])

  const destinations = origin ? demoDestinations(origin, attackerPort) : null
  const presets = destinations ? [
    { label: 'Внешний адрес', value: destinations.external },
    { label: 'Адрес без протокола //', value: destinations.external.replace(/^http:/, '') },
    { label: 'Заказ внутри магазина', value: '/site/redirect/order' },
  ] : []
  const link = origin ? `${origin}/site/redirect/go?${new URLSearchParams({ next })}` : ''

  return <div className="redirect-layout">
    <section className="redirect-mail" aria-label="Письмо с заказом">
      <div className="delivery-mail-heading"><MailOutlined /><span>Входящие</span></div>
      <Typography.Title level={3}>Ваш заказ готов к выдаче</Typography.Title>
      <dl className="delivery-mail-meta">
        <dt>От</dt><dd>Заказы &lt;orders@shop.example.test&gt;</dd>
        <dt>Кому</dt><dd>Алекс &lt;alex@example.test&gt;</dd>
      </dl>
      <img src="/presentation/catalog.png" alt="Каталог электротехнической продукции" width={420} height={227} />
      <Typography.Paragraph>Алекс, заказ №48216 собран. Проверьте детали перед получением.</Typography.Paragraph>
      <Button type="primary" href={link || undefined} disabled={!link} icon={<ArrowRightOutlined />}>Посмотреть заказ</Button>
      <div className="redirect-received-link">
        <Typography.Text type="secondary">Ссылка из письма</Typography.Text>
        <a href={link || undefined} data-testid="redirect-link">{link || '...'}</a>
      </div>
    </section>
    <section className="redirect-parameters" aria-label="Адрес перехода">
      <Typography.Title level={3}>Адрес перехода</Typography.Title>
      <label htmlFor="redirect-preset">Вариант ссылки</label>
      <Select id="redirect-preset" aria-label="Вариант ссылки" disabled={!origin} options={presets} value={presets.some((preset) => preset.value === next) ? next : undefined} placeholder="Свой адрес" onChange={setNext} />
      <label htmlFor="redirect-next">Параметр next</label>
      <Input.TextArea id="redirect-next" disabled={!origin} value={next} onChange={(event) => setNext(event.target.value)} rows={4} spellCheck={false} />
      <dl className="redirect-origins">
        <dt>Магазин</dt><dd>{origin || '...'}</dd>
        <dt>Внешний сайт</dt><dd>{destinations ? new URL(destinations.external).origin : '...'}</dd>
      </dl>
    </section>
  </div>
}
