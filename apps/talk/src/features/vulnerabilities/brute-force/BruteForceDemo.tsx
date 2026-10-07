'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Input, Table, Tag } from 'antd'
import { LoginOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons'
import type { DemoMode } from '@/shared/lib/demoMode'
import { BackendLayout, ServerResult, useBackendDemo, type Reply } from '@/features/backend-lab/client'

interface Result extends Reply { failures?: number; authenticated?: boolean; retryAfter?: number }
const candidates = ['123456', 'password', 'qwerty', 'welcome', 'Cable2025!', 'Cable2026!', 'admin', 'letmein']
type Attempt = { key: number; password: string; status: number; message: string }
export function BruteForceDemo({ mode }: { mode: DemoMode }) {
  const demo = useBackendDemo<Result>('brute-force', mode)
  const [password, setPassword] = useState('')
  const [rows, setRows] = useState<Attempt[]>([])
  const [running, setRunning] = useState(false)
  const generation = useRef(0)
  useEffect(() => {
    const reset = () => { generation.current++; setRows([]); setRunning(false) }
    reset()
    window.addEventListener('demo:reset', reset)
    return () => { generation.current++; window.removeEventListener('demo:reset', reset) }
  }, [mode])
  const run = async () => {
    const current = ++generation.current
    setRows([])
    setRunning(true)
    for (const candidate of candidates) {
      if (current !== generation.current) break
      const result = await demo.call({ password: candidate })
      if (current !== generation.current || !result) break
      setRows((previous) => [...previous, { key: previous.length + 1, password: candidate, status: result.status, message: result.message }])
      if (result.authenticated || ![401, 429].includes(result.status)) break
    }
    if (current === generation.current) setRunning(false)
  }
  return <BackendLayout title="Перебор пароля аккаунта" mode={mode} busy={demo.busy || running}>
    <div className="backend-columns">
      <section><h3>Вход · alex@example.test</h3>
        <form onSubmit={(event) => { event.preventDefault(); void demo.call({ password }) }}>
          <label htmlFor="brute-password">Пароль</label>
          <Input.Password id="brute-password" value={password} maxLength={100} onChange={(event) => setPassword(event.target.value)} disabled={demo.busy || running} />
          <Button type="primary" htmlType="submit" icon={<LoginOutlined aria-hidden />} disabled={demo.busy || running || !password}>Войти</Button>
        </form>
        <h4>Список кандидатов · 8 паролей</h4><pre>{candidates.join('\n')}</pre>
        <div className="backend-actions"><Button danger icon={<PlayCircleOutlined />} disabled={demo.busy || running} onClick={() => { void run() }}>Проверить список</Button>
          {running && <Button icon={<StopOutlined />} onClick={() => { generation.current++; setRunning(false) }}>Остановить</Button>}</div>
      </section>
      <ServerResult {...demo}>
        {demo.result?.authenticated && <h3 data-testid="brute-account">Сервер разрешил вход в аккаунт Алекса</h3>}
        {demo.result?.retryAfter && <Tag color="orange">Retry-After: {demo.result.retryAfter} с</Tag>}
        <Table size="small" pagination={false} dataSource={rows} scroll={{ x: 440 }} columns={[
          { title: '№', dataIndex: 'key', width: 50 }, { title: 'Пароль', dataIndex: 'password' },
          { title: 'HTTP', dataIndex: 'status', width: 70 }, { title: 'Ответ', dataIndex: 'message' },
        ]} />
      </ServerResult>
    </div>
  </BackendLayout>
}
