'use client';

import { App, Alert, Button, Card, Form, Input, Tag, Typography } from 'antd';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { Logo } from '@/components/Logo';
import { apiLogin } from '@/lib/api';

const { Text, Paragraph } = Typography;

function isExternal(url: string) {
  return /^https?:\/\//i.test(url) || url.startsWith('//');
}

function LoginInner() {
  const params = useSearchParams();
  const returnUrl = params.get('returnUrl') ?? '/';
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  async function onFinish(values: { login: string; password: string }) {
    setLoading(true);
    try {
      await apiLogin(values.login, values.password);
      // ⚠️ Open Redirect: returnUrl уходит в переход без allowlist/валидации.
      window.location.assign(returnUrl);
    } catch (e) {
      message.error((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 24,
      }}
    >
      <Logo />
      <Card style={{ width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          Вход в личный кабинет
        </Typography.Title>

        {isExternal(returnUrl) && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            message="Внешний returnUrl"
            description={
              <Text code style={{ wordBreak: 'break-all' }}>
                {returnUrl}
              </Text>
            }
          />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="login"
            label="Логин"
            rules={[{ required: true, message: 'Введите логин' }]}
          >
            <Input size="large" placeholder="ivanov" autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password
              size="large"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
          >
            Войти
          </Button>
        </Form>

        <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
          Тестовый аккаунт: <Tag>ivanov</Tag> / <Tag>qwerty123</Tag>
        </Paragraph>
      </Card>

      <Text type="secondary" style={{ maxWidth: 380, textAlign: 'center' }}>
        Демо Open Redirect: откройте{' '}
        <Text code>/login?returnUrl=https://example.com</Text> и войдите — после
        входа произойдёт переход на внешний адрес.
      </Text>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
