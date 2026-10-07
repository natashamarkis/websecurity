'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Flex, Input, Spin, Tag, Tooltip, Typography } from 'antd'
import { ExportOutlined, MailOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'

interface Profile {
  address: string
  csrfToken: string
  lastAttempt: { origin: string; accepted: boolean } | null
}

export function DeliveryProfile({ attackerPort }: { attackerPort: number }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)
  const [offerUrl, setOfferUrl] = useState('')
  const initialized = useRef(false)
  const inFlight = useRef<Promise<void> | null>(null)

  const load = useCallback(async (syncDraft = false) => {
    // Первый GET создаёт cookie: Strict Mode и focus не должны создавать две сессии.
    if (inFlight.current) {
      await inFlight.current
      if (!syncDraft) return
    }
    const task = (async () => {
      try {
        const response = await fetch('/api/site/delivery', { cache: 'no-store' })
        if (!response.ok) throw new Error('Не удалось загрузить профиль')
        const data: Profile = await response.json()
        setProfile(data)
        if (!initialized.current || syncDraft) setDraft(data.address)
        initialized.current = true
        setError('')
      } catch {
        setError('Не удалось загрузить профиль. Повторите запрос.')
      }
    })()
    inFlight.current = task
    await task
    if (inFlight.current === task) inFlight.current = null
  }, [])

  useEffect(() => {
    const url = new URL(window.location.origin)
    url.port = String(attackerPort)
    url.pathname = '/offer'
    url.searchParams.set('victimPort', window.location.port || '80')
    setOfferUrl(url.href)
    void load()
    const refresh = () => { void load() }
    const reset = () => { setSaved(false); void load(true) }
    window.addEventListener('focus', refresh)
    window.addEventListener('demo:reset', reset)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('demo:reset', reset)
    }
  }, [attackerPort, load])

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile) return
    setPending(true)
    setSaved(false)
    setError('')
    try {
      const response = await fetch('/api/site/delivery', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new URLSearchParams({ address: draft, csrfToken: profile.csrfToken }),
      })
      const result = await response.json() as { message: string }
      if (!response.ok) throw new Error(result.message)
      await load(true)
      setSaved(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить адрес')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="delivery-layout">
      <section className="delivery-profile">
        <Flex align="center" justify="space-between" gap={12}>
          <Typography.Title level={3}>Адрес доставки</Typography.Title>
          <Tooltip title="Обновить профиль"><Button aria-label="Обновить профиль" icon={<ReloadOutlined />} onClick={() => { void load() }} /></Tooltip>
        </Flex>
        {error && <Alert type="error" title={error} role="alert" showIcon />}
        {!profile ? <Spin aria-label="Загрузка профиля" /> : <>
          <div className="delivery-current">
            <Typography.Text type="secondary">Текущий адрес</Typography.Text>
            <Typography.Paragraph data-testid="delivery-address">{profile.address}</Typography.Paragraph>
          </div>
          <form onSubmit={save}>
            <label htmlFor="delivery-address-input">Новый адрес</label>
            <Input id="delivery-address-input" value={draft} onChange={(event) => { setDraft(event.target.value); setSaved(false) }} minLength={5} maxLength={200} required />
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={pending}>Сохранить адрес</Button>
          </form>
          {saved && <Alert type="success" title="Адрес сохранён" role="status" showIcon />}
          {profile.lastAttempt && <div className="delivery-attempt" aria-live="polite">
            <Tag color={profile.lastAttempt.accepted ? 'green' : 'red'}>{profile.lastAttempt.accepted ? 'Запрос принят' : 'Запрос отклонён'}</Tag>
            <Typography.Text type="secondary">Источник последнего запроса</Typography.Text>
            <Typography.Text code data-testid="delivery-origin">{profile.lastAttempt.origin}</Typography.Text>
          </div>}
        </>}
      </section>
      <aside className="delivery-offer" aria-label="Письмо с акцией">
        <div className="delivery-mail-heading"><MailOutlined /> <span>Почта</span><Tag color="blue">Входящие</Tag></div>
        <Typography.Title level={4}>Вам скидка 20% на доставку</Typography.Title>
        <dl className="delivery-mail-meta">
          <dt>От кого</dt><dd>Служба акций &lt;promo@delivery-bonus.example&gt;</dd>
          <dt>Кому</dt><dd>Мне</dd>
        </dl>
        <Typography.Paragraph>Здравствуйте! Для вас доступна персональная скидка на доставку. Перейдите по ссылке, чтобы получить её.</Typography.Paragraph>
        <img src="/presentation/catalog.png" alt="Каталог электротехнической продукции" width={420} height={300} />
        <Button href={offerUrl || undefined} target="_blank" rel="noopener noreferrer" icon={<ExportOutlined />} disabled={!profile || !offerUrl}>Открыть акцию</Button>
      </aside>
    </div>
  )
}
