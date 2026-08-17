'use client';

import { Card, Collapse, List, Spin, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { VulnBadge } from '@/components/VulnBadge';

interface JobItem {
  uuid: string;
  org: { name: string; inn: string; kpp: string };
  fio: string;
  amount: number;
  status: string;
  mine: boolean;
}

const money = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

export default function FactoringListPage() {
  const [own, setOwn] = useState<JobItem[] | null>(null);
  const [all, setAll] = useState<JobItem[] | null>(null);

  useEffect(() => {
    fetch('/api/factoring?scope=own', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setOwn(d.jobs));
  }, []);

  function loadAll() {
    if (all) return;
    fetch('/api/factoring?scope=all', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAll(d.jobs));
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <Typography.Title level={3}>Факторинг</Typography.Title>
      <VulnBadge title="IDOR — доступ к чужой заявке по uuid + CSRF на изменение статуса" />

      <Card title="Мои заявки" size="small" style={{ marginBottom: 16 }}>
        {!own ? (
          <Spin />
        ) : (
          <List
            dataSource={own}
            renderItem={(j) => (
              <List.Item
                actions={[
                  <Link key="open" href={`/factoring/${j.uuid}`}>
                    Открыть
                  </Link>,
                ]}
              >
                <List.Item.Meta
                  title={<Link href={`/factoring/${j.uuid}`}>{j.org.name}</Link>}
                  description={`ИНН ${j.org.inn} · ${money(j.amount)}`}
                />
                <Tag>{j.status}</Tag>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Collapse
        onChange={loadAll}
        items={[
          {
            key: 'all',
            label:
              'Все заявки в системе (демонстрация IDOR — цели, к которым не должно быть доступа)',
            children: !all ? (
              <Spin />
            ) : (
              <List
                dataSource={all}
                renderItem={(j) => (
                  <List.Item
                    actions={[
                      <Link key="open" href={`/factoring/${j.uuid}`}>
                        Открыть
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <>
                          <Link href={`/factoring/${j.uuid}`}>{j.org.name}</Link>{' '}
                          {j.mine ? (
                            <Tag color="blue">моя</Tag>
                          ) : (
                            <Tag color="red">чужая</Tag>
                          )}
                        </>
                      }
                      description={
                        <Typography.Text
                          type="secondary"
                          copyable={{ text: j.uuid }}
                        >
                          uuid: {j.uuid}
                        </Typography.Text>
                      }
                    />
                    <Tag>{j.status}</Tag>
                  </List.Item>
                )}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
