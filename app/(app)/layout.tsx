'use client';

import { Layout, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppHeader } from '@/components/AppHeader';
import { AppSider } from '@/components/AppSider';
import { apiSession, type SessionUser } from '@/lib/api';

// ⚠️ Контроль доступа только на клиенте (по паттерну оригинала: проверка
// наличия куки + isAuth). Тривиально обходится в devtools — это пара к
// серверному IDOR: настоящей проверки прав на бэкенде нет.
export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiSession().then((u) => {
      if (!u) {
        router.replace(
          '/login?returnUrl=' + encodeURIComponent(window.location.pathname),
        );
        return;
      }
      setUser(u);
      setLoading(false);
    });
  }, [router]);

  if (loading || !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader user={user} />
      <Layout>
        <AppSider />
        <Layout.Content style={{ padding: 24 }}>{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}
