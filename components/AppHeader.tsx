'use client';

import { BookOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Space, type MenuProps } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ETM } from '@/lib/theme';

import { Logo } from './Logo';
import { apiLogout, type SessionUser } from '@/lib/api';

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
        justifyContent: 'space-between',
        height: ETM.headerHeight,
        background: ETM.dark,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Logo light />
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
