'use client'

import { useState } from 'react'
import { Button, Input, Radio } from 'antd'
import { CloudDownloadOutlined } from '@ant-design/icons'
import type { DemoMode } from '@/shared/lib/demoMode'
import { BackendLayout, ServerResult, useBackendDemo, type Reply } from '@/features/backend-lab/client'
import { SUPPLIER_URL, INTERNAL_URL, REDIRECT_URL } from './targets'

interface Result extends Reply { body?: string; trace?: string[] }
export function SsrfDemo({ mode }: { mode: DemoMode }) {
  const [url, setUrl] = useState(SUPPLIER_URL)
  const demo = useBackendDemo<Result>('ssrf', mode)
  return <BackendLayout title="Импорт каталога поставщика" mode={mode} busy={demo.busy}>
    <div className="backend-columns">
      <section><h3>Источник каталога</h3>
        <Radio.Group className="backend-options" value={url} onChange={(event) => setUrl(event.target.value)} disabled={demo.busy} options={[
          { label: 'Каталог поставщика', value: SUPPLIER_URL },
          { label: 'Внутренняя бухгалтерия', value: INTERNAL_URL },
          { label: 'Редирект поставщика во внутреннюю сеть', value: REDIRECT_URL },
        ]} />
        <form onSubmit={(event) => { event.preventDefault(); void demo.call({ url }) }}>
          <label htmlFor="source-url">URL для загрузки сервером</label>
          <Input id="source-url" value={url} maxLength={300} onChange={(event) => setUrl(event.target.value)} disabled={demo.busy} />
          <Button htmlType="submit" type="primary" icon={<CloudDownloadOutlined />} loading={demo.busy}>Загрузить на сервере</Button>
        </form>
        <img className="backend-catalog" src="/presentation/catalog.png" alt="Каталог поставщика" />
      </section>
      <ServerResult {...demo}>
        {demo.result?.trace && <ol className="backend-trace">{demo.result.trace.map((line, index) => <li key={index}>{line}</li>)}</ol>}
        {demo.result?.body && <pre data-testid="ssrf-body">{JSON.stringify(JSON.parse(demo.result.body), null, 2)}</pre>}
      </ServerResult>
    </div>
  </BackendLayout>
}
