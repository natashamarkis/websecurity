'use client';

import {
  BookOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Space, type MenuProps } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { apiLogout, type SessionUser } from '@/lib/api';
import { ETM } from '@/lib/theme';

import { Logo } from './Logo';

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
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Logo />
      <Menu
        mode="horizontal"
        selectable={false}
        items={topItems}
        style={{ flex: 1, minWidth: 0, borderBottom: 'none', background: 'transparent' }}
      />
      <Dropdown menu={userMenu} trigger={['click']}>
        <Space style={{ cursor: 'pointer' }}>
          <Avatar
            size="small"
            icon={<UserOutlined />}
            style={{ backgroundColor: ETM.primary }}
          />
          <span>{user.fio}</span>
        </Space>
      </Dropdown>
    </Layout.Header>
  );
}
