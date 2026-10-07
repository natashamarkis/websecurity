'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Tag } from 'antd'
import { LinkOutlined, LoginOutlined, SearchOutlined, LogoutOutlined } from '@ant-design/icons'
import type { DemoMode } from '@/shared/lib/demoMode'
import { BackendLayout, ServerResult, useBackendDemo, type Reply } from '@/features/backend-lab/client'

interface Result extends Reply {
  attackerId?: string; victimId?: string; loggedIn?: boolean
  profile?: { name: string; email: string; address: string } | null
}
export function SessionsDemo({ mode }: { mode: DemoMode }) {
  const demo = useBackendDemo<Result>('sessions', mode)
  const [password, setPassword] = useState('Demo-Alex-2026!')
  const [snapshot, setSnapshot] = useState<Result | null>(null)
  useEffect(() => {
    if (demo.result?.victimId) setSnapshot(demo.result)
    else if (!demo.result || demo.result.status === 200) setSnapshot(null)
  }, [demo.result])
  return <BackendLayout title="Session Fixation: вход в аккаунт" mode={mode} busy={demo.busy}>
    <div className="backend-session-start">
      <Button icon={<LinkOutlined />} onClick={() => { void demo.call({ action: 'plant' }) }} disabled={demo.busy}>1. Навязать анонимную сессию</Button>
      <Tag>Два учебных клиента</Tag>
      {snapshot?.victimId && <Tag color={snapshot.victimId === snapshot.attackerId ? 'orange' : 'green'}>{snapshot.victimId === snapshot.attackerId ? 'Session ID совпадают' : 'Покупатель получил новый Session ID'}</Tag>}
    </div>
    <div className="backend-columns">
      <section><h3>Браузер покупателя · Алекс</h3>
        <dl className="backend-meta"><dt>Session ID</dt><dd data-testid="victim-session">{snapshot?.victimId ?? 'Нет сессии'}</dd><dt>Аккаунт</dt><dd>{snapshot?.loggedIn ? 'Алекс' : 'Гость'}</dd></dl>
        <form onSubmit={(event) => { event.preventDefault(); void demo.call({ action: 'login', password }) }}>
          <label htmlFor="session-password">Пароль учебного аккаунта</label>
          <Input.Password id="session-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={demo.busy} maxLength={100} />
          <Button type="primary" htmlType="submit" icon={<LoginOutlined />} disabled={demo.busy || !snapshot?.victimId || snapshot.loggedIn}>2. Войти как Алекс</Button>
        </form>
        <Button icon={<LogoutOutlined />} disabled={demo.busy || !snapshot?.loggedIn} onClick={() => { void demo.call({ action: 'logout' }) }}>Выйти из аккаунта</Button>
      </section>
      <section><h3>Браузер атакующего</h3>
        <dl className="backend-meta"><dt>Известный Session ID</dt><dd data-testid="attacker-session">{snapshot?.attackerId ?? 'Нет сессии'}</dd><dt>Пароль Алекса</dt><dd>Неизвестен</dd></dl>
        <Button danger icon={<SearchOutlined />} disabled={demo.busy || !snapshot?.victimId} onClick={() => { void demo.call({ action: 'probe' }) }}>3. Запросить профиль со старым ID</Button>
      </section>
    </div>
    <ServerResult {...demo}>
      {demo.result?.profile && <dl className="backend-meta" data-testid="stolen-profile"><dt>Имя</dt><dd>{demo.result.profile.name}</dd><dt>Email</dt><dd>{demo.result.profile.email}</dd><dt>Адрес</dt><dd>{demo.result.profile.address}</dd></dl>}
    </ServerResult>
  </BackendLayout>
}
