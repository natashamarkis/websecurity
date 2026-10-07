'use client'

import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Flex, Spin, Tag, Tooltip, Typography } from 'antd'
import { ExportOutlined, MailOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'

export function ClickjackingDemo({ attackerPort }: { attackerPort: number }) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [offerUrl, setOfferUrl] = useState('')
  const refresh = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let loading = false
    const load = async () => {
      if (loading) return
      loading = true
      try {
        const response = await fetch('/api/site/notifications', { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error('Profile unavailable')
        const profile: { enabled: boolean } = await response.json()
        setEnabled(profile.enabled)
        setError('')
      } catch {
        if (!controller.signal.aborted) setError('Не удалось загрузить настройки. Повторите запрос.')
      } finally {
        loading = false
      }
    }
    refresh.current = load
    const url = new URL(window.location.origin)
    url.port = String(attackerPort)
    url.pathname = '/clickjacking'
    url.searchParams.set('shopPort', window.location.port || '80')
    setOfferUrl(url.href)
    void load()
    const onRefresh = () => { void load() }
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load() }, 2000)
    window.addEventListener('focus', onRefresh)
    window.addEventListener('demo:reset', onRefresh)
    return () => {
      controller.abort()
      refresh.current = null
      window.clearInterval(timer)
      window.removeEventListener('focus', onRefresh)
      window.removeEventListener('demo:reset', onRefresh)
    }
  }, [attackerPort])

  return <div className="delivery-layout">
    <section className="delivery-profile" aria-label="Настройки безопасности">
      <Flex align="center" justify="space-between" gap={12}>
        <Typography.Title level={3}>Безопасность аккаунта</Typography.Title>
        <Tooltip title="Обновить настройки"><Button aria-label="Обновить настройки" icon={<ReloadOutlined />} onClick={() => { void refresh.current?.() }} /></Tooltip>
      </Flex>
      {error && <Alert type="error" title={error} role="alert" showIcon />}
      <div className="delivery-current">
        <Typography.Text type="secondary">Уведомления о входе</Typography.Text>
        <Typography.Paragraph aria-live="polite" data-testid="notifications-status">
          {enabled === null ? <Spin aria-label="Загрузка настроек" /> : <Tag color={enabled ? 'green' : 'red'}>{enabled ? 'Включены' : 'Отключены'}</Tag>}
        </Typography.Paragraph>
      </div>
      <Typography.Paragraph>Письмо при входе с нового устройства: customer@example.test</Typography.Paragraph>
      <Button href="/site/notifications/action" target="_blank" rel="noopener noreferrer" icon={<SettingOutlined />} disabled={enabled === null}>Настройки уведомлений</Button>
    </section>
    <aside className="delivery-offer" aria-label="Письмо с бонусом">
      <div className="delivery-mail-heading"><MailOutlined /><span>Почта</span><Tag color="blue">Входящие</Tag></div>
      <Typography.Title level={4}>Вам доступно 500 бонусных баллов</Typography.Title>
      <dl className="delivery-mail-meta">
        <dt>От кого</dt><dd>Акции партнёров &lt;bonus@shop-rewards.example&gt;</dd>
        <dt>Кому</dt><dd>Мне</dd>
      </dl>
      <Typography.Paragraph>Спасибо за покупку! Заберите персональный бонус для следующего заказа.</Typography.Paragraph>
      <img src="/presentation/catalog.png" alt="Каталог электротехнической продукции" width={420} height={300} />
      <Button href={offerUrl || undefined} target="_blank" rel="noopener noreferrer" icon={<ExportOutlined />} disabled={enabled === null || !offerUrl}>Открыть предложение</Button>
    </aside>
  </div>
}
