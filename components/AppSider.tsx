'use client';

import { BankOutlined, BookOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Layout, Menu, type MenuProps } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { ETM } from '@/lib/theme';

const items: MenuProps['items'] = [
  { key: '/orders', icon: <ShoppingOutlined />, label: 'Заказы' },
  { key: '/factoring', icon: <BankOutlined />, label: 'Факторинг' },
  { key: '/knowledge-base', icon: <BookOutlined />, label: 'База знаний' },
];

const routeKeys = ['/orders', '/factoring', '/knowledge-base'];

export function AppSider() {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const selectedKey = routeKeys.find((r) => pathname.startsWith(r)) ?? '';

  return (
    <Layout.Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      theme="dark"
      width={256}
      style={{ background: ETM.dark }}
    >
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={items}
        onClick={({ key }) => router.push(key)}
        style={{ height: '100%', borderInlineEnd: 'none', background: ETM.dark }}
      />
    </Layout.Sider>
  );
}
