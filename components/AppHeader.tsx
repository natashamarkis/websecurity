'use client';

import { BookOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Space, type MenuProps } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ETM } from '@/lib/theme';

import { Logo } from './Logo';
import { apiLogout, type SessionUser } from '@/lib/api';

const topItems: MenuProps['items'] = [
  { key: 'products', label: 'Товары' },
  { key: 'pricing', label: 'Ценообразование' },
  { key: 'supplies', label: 'Поставки' },
  { key: 'finance', label: 'Финансы' },
  { key: 'integration', label: 'Интеграции' },
];

export function AppHeader({ user }: { user: SessionUser }) {
  const router = useRouter();

  async function handleLogout() {
    await apiLogout();
    router.replace('/login');
  }

  const userMenu: MenuProps = {
    items: [
      {
        key: 'wiki',
        icon: <BookOutlined />,
        label: <Link href="/">Вики уязвимостей</Link>,
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Выйти',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout.Header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        height: ETM.headerHeight,
        background: ETM.dark,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Logo light />
      <Menu
        mode="horizontal"
        theme="dark"
        selectable={false}
        items={topItems}
        style={{
          flex: 1,
          minWidth: 0,
          borderBottom: 'none',
          background: 'transparent',
        }}
      />
      <Dropdown menu={userMenu} trigger={['click']}>
        <Space style={{ cursor: 'pointer', color: '#fff' }}>
          <Avatar
            size="small"
            icon={<UserOutlined />}
            style={{ backgroundColor: ETM.primary }}
          />
          <span style={{ color: '#fff' }}>{user.fio}</span>
        </Space>
      </Dropdown>
    </Layout.Header>
  );
}
