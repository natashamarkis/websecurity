'use client';

import { InboxOutlined, ThunderboltOutlined } from '@ant-design/icons';
import {
  App,
  Alert,
  Button,
  Card,
  Descriptions,
  Result,
  Select,
  Space,
  Spin,
  Typography,
  Upload,
} from 'antd';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { VulnBadge } from '@/components/VulnBadge';

const STATUSES = ['На проверке', 'Одобрена', 'Отклонена', 'Выплачена'];
const money = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

interface Job {
  uuid: string;
  org: { name: string; inn: string; kpp: string };
  fio: string;
  amount: number;
  status: string;
}

export default function FactoringDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { message } = App.useApp();
  const [job, setJob] = useState<Job | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');
  const [status, setStatus] = useState<string>();
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    const r = await fetch(`/api/job/${uuid}`, { credentials: 'include' });
    if (!r.ok) {
      setState('notfound');
      return;
    }
    const d = await r.json();
    setJob(d.job);
    setStatus(d.job.status);
    setState('ok');
  }, [uuid]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!status) return;
    setSaving(true);
    const r = await fetch(`/api/job/${uuid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    const d = await r.json();
    setJob(d.job);
    setSaving(false);
    message.success('Статус заявки обновлён');
  }

  function openCsrfPoc() {
    window.open(
      `/csrf-poc.html?uuid=${encodeURIComponent(uuid)}&status=${encodeURIComponent('Одобрена')}`,
      '_blank',
    );
  }

  if (state === 'loading') return <Spin size="large" />;
  if (state === 'notfound')
    return <Result status="404" title="Заявка не найдена" />;

  return (
    <div style={{ maxWidth: 760 }}>
      <Typography.Title level={3}>Факторинг-заявка</Typography.Title>
      <VulnBadge title="IDOR — попробуйте поменять uuid в адресной строке на чужой; CSRF — статус меняется без токена" />

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Организация">
            {job!.org.name}
          </Descriptions.Item>
          <Descriptions.Item label="ИНН / КПП">
            {job!.org.inn} / {job!.org.kpp}
          </Descriptions.Item>
          <Descriptions.Item label="Подписант">{job!.fio}</Descriptions.Item>
          <Descriptions.Item label="Сумма">
            {money(job!.amount)}
          </Descriptions.Item>
          <Descriptions.Item label="Статус">{job!.status}</Descriptions.Item>
          <Descriptions.Item label="uuid">
            <Typography.Text copyable code>
              {job!.uuid}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Документы" size="small" style={{ marginBottom: 16 }}>
        <Upload.Dragger
          multiple
          beforeUpload={() => false}
          onChange={() => message.info('Демо: файл не загружается на сервер')}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Перетащите документы сюда или нажмите для выбора
          </p>
        </Upload.Dragger>
      </Card>

      <Card title="Изменение статуса" size="small">
        <Space wrap>
          <Select
            value={status}
            onChange={setStatus}
            style={{ width: 200 }}
            options={STATUSES.map((s) => ({ value: s, label: s }))}
          />
          <Button type="primary" loading={saving} onClick={save}>
            Сохранить
          </Button>
          <Button
            icon={<ThunderboltOutlined />}
            danger
            onClick={openCsrfPoc}
          >
            Сформировать CSRF-PoC
          </Button>
        </Space>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message="CSRF-PoC откроет страницу, которая сама отправит POST на этот эндпоинт с вашей кукой сессии. CSRF-токена нет — запрос проходит. Затем обновите эту страницу: статус изменится."
        />
      </Card>
    </div>
  );
}
