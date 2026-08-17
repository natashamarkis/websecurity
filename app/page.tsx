'use client';

import { PlayCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Layout, List, Space, Tag, Typography } from 'antd';
import Link from 'next/link';

import { Logo } from '@/components/Logo';
import { PayloadCopy } from '@/components/PayloadCopy';
import { WIKI, type WikiEntry } from '@/lib/wiki';

const { Title, Paragraph, Text } = Typography;

const severityColor: Record<WikiEntry['severity'], string> = {
  Критическая: 'red',
  Высокая: 'volcano',
  Средняя: 'gold',
};

function Label({ children }: { children: string }) {
  return (
    <Text strong style={{ display: 'block', marginTop: 12 }}>
      {children}
    </Text>
  );
}

export default function WikiHomePage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Logo />
        <Link href="/login">
          <Button type="primary">Войти в приложение</Button>
        </Link>
      </Layout.Header>

      <Layout.Content style={{ padding: '24px', maxWidth: 1040, margin: '0 auto', width: '100%' }}>
        <Title level={2} style={{ marginBottom: 4 }}>
          Каталог веб-уязвимостей
        </Title>
        <Paragraph type="secondary">
          Учебные примеры в стилистике iPRO OneTeam. По каждой уязвимости: что
          это, где «у нас», как абузить, во что выливается и как чинить.
        </Paragraph>

        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 24 }}
          message="Приложение намеренно уязвимо"
          description="Только для локального обучения. Не деплоить в интернет, не использовать в проде."
        />

        <List
          grid={{ gutter: 16, xs: 1, lg: 2 }}
          dataSource={WIKI}
          renderItem={(e) => (
            <List.Item>
              <Card
                id={e.id}
                title={
                  <Space>
                    <span>{e.title}</span>
                    <Tag color={severityColor[e.severity]}>{e.severity}</Tag>
                  </Space>
                }
                extra={
                  <Space size={4}>
                    <Tag>{e.cwe}</Tag>
                  </Space>
                }
              >
                <Tag color="blue" style={{ marginBottom: 8 }}>
                  {e.owasp}
                </Tag>

                <Label>Что это</Label>
                <Paragraph style={{ marginBottom: 0 }}>{e.what}</Paragraph>

                <Label>Где у нас</Label>
                <Paragraph style={{ marginBottom: 0 }}>{e.where}</Paragraph>

                <Label>Как абузить</Label>
                <ol style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                  {e.howToAbuse.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>

                {e.payload && (
                  <>
                    <Label>Payload</Label>
                    <PayloadCopy code={e.payload} />
                  </>
                )}

                <Label>Impact</Label>
                <Paragraph style={{ marginBottom: 0 }}>{e.impact}</Paragraph>

                <Label>Как чинить</Label>
                <Paragraph style={{ marginBottom: 12 }}>{e.fix}</Paragraph>

                <Link href={e.liveHref}>
                  <Button type="primary" icon={<PlayCircleOutlined />}>
                    {e.liveLabel}
                  </Button>
                </Link>
              </Card>
            </List.Item>
          )}
        />

        <Paragraph type="secondary" style={{ marginTop: 24, textAlign: 'center' }}>
          Подробная теория по каждой уязвимости — в{' '}
          <Text code>docs/security-guide/</Text>.
        </Paragraph>
      </Layout.Content>
    </Layout>
  );
}
