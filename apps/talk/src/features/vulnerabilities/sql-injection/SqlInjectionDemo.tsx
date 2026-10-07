'use client'

import { useState } from 'react'
import { Button, Input, Radio, Table } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { DemoMode } from '@/shared/lib/demoMode'
import { BackendLayout, ServerResult, useBackendDemo, type Reply } from '@/features/backend-lab/client'

interface Order { id: number; customer_id: string; customer: string; product: string; address: string }
interface Result extends Reply { sql?: string; parameters?: string[]; orders?: Order[] }
export function SqlInjectionDemo({ mode }: { mode: DemoMode }) {
  const [search, setSearch] = useState('Кабель')
  const demo = useBackendDemo<Result>('sql-injection', mode)
  return <BackendLayout title="Мои заказы · Алекс" mode={mode} busy={demo.busy}>
    <div className="backend-columns">
      <section><h3>Поиск по товару</h3>
        <Radio.Group className="backend-options" value={search} disabled={demo.busy} onChange={(event) => setSearch(event.target.value)} options={[
          { label: 'Обычный поиск', value: 'Кабель' }, { label: 'SQL-инъекция', value: "' OR 1=1 --" },
        ]} />
        <form onSubmit={(event) => { event.preventDefault(); void demo.call({ search }) }}>
          <label htmlFor="order-search">Название товара</label>
          <Input id="order-search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={200} disabled={demo.busy} />
          <Button type="primary" htmlType="submit" loading={demo.busy} icon={<SearchOutlined />}>Найти заказы</Button>
        </form>
        <dl className="backend-meta"><dt>Пользователь на сервере</dt><dd>alex</dd><dt>Доступ</dt><dd>Только свои заказы</dd></dl>
      </section>
      <ServerResult {...demo}>
        {demo.result?.sql && <><h4>SQL, выполненный SQLite</h4><pre data-testid="executed-sql">{demo.result.sql}</pre>
          <h4>Параметры отдельно от SQL</h4><pre>{JSON.stringify(demo.result.parameters)}</pre></>}
      </ServerResult>
    </div>
    {demo.result?.orders && <Table size="small" rowKey="id" pagination={false} scroll={{ x: 600 }} dataSource={demo.result.orders}
      rowClassName={(row) => row.customer_id !== 'alex' ? 'backend-foreign-row' : ''}
      columns={[
        { title: 'Заказ', dataIndex: 'id' }, { title: 'Покупатель', dataIndex: 'customer' },
        { title: 'Товар', dataIndex: 'product' }, { title: 'Адрес доставки', dataIndex: 'address' },
      ]} />}
  </BackendLayout>
}
