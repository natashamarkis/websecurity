'use client';

import { Input, Space, Table, Tag, Typography, type TableProps } from 'antd';
import { useEffect, useState } from 'react';

import { VulnBadge } from '@/components/VulnBadge';

interface Order {
  orderCode: string;
  date: string;
  supplier: string;
  status: string;
  sum: number;
}

const columns: TableProps<Order>['columns'] = [
  { title: 'Код заказа', dataIndex: 'orderCode', key: 'orderCode' },
  { title: 'Дата', dataIndex: 'date', key: 'date', width: 120 },
  { title: 'Поставщик', dataIndex: 'supplier', key: 'supplier' },
  {
    title: 'Статус',
    dataIndex: 'status',
    key: 'status',
    width: 140,
    render: (s: string) => <Tag>{s}</Tag>,
  },
  {
    title: 'Сумма',
    dataIndex: 'sum',
    key: 'sum',
    align: 'right',
    width: 140,
    render: (n: number) => `${n.toLocaleString('ru-RU')} ₽`,
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  async function load(orderCode: string) {
    setLoading(true);
    const r = await fetch(
      `/api/orders?orderCode=${encodeURIComponent(orderCode)}`,
      { credentials: 'include' },
    );
    const d = await r.json();
    setOrders(d.orders);
    setFilter(d.filter);
    setLoading(false);
  }

  useEffect(() => {
    load('');
  }, []);

  return (
    <div>
      <Typography.Title level={3}>Заказы</Typography.Title>
      <VulnBadge title="Reflected XSS — значение поиска отображается как «чип» без экранирования" />

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Input.Search
          placeholder="Код заказа, напр. ЗК-1234"
          onSearch={load}
          allowClear
          enterButton
          style={{ maxWidth: 360 }}
        />

        {filter && (
          <div>
            <Typography.Text type="secondary">Активный фильтр: </Typography.Text>
            {/* ⚠️ Reflected XSS: filter вставляется в DOM как сырой HTML.
                Введите в поиск: <img src=x onerror=alert(document.domain)> */}
            <span
              dangerouslySetInnerHTML={{
                __html: `<span style="display:inline-block;padding:2px 10px;border:1px solid #91caff;background:#e6f4ff;border-radius:12px;color:#0847a8;font-size:13px">${filter}</span>`,
              }}
            />
          </div>
        )}

        <Table<Order>
          rowKey="orderCode"
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Space>
    </div>
  );
}
