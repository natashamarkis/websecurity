'use client';

import {
  AppstoreOutlined,
  BankOutlined,
  BookOutlined,
  DollarOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { Layout, Menu, type MenuProps } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { ETM } from '@/lib/theme';

const items: MenuProps['items'] = [
  {
    key: 'grp-products',
    icon: <AppstoreOutlined />,
    label: 'Товары',
    children: [
      { key: 'products-manage', label: 'Управление товарами', disabled: true },
      { key: 'products-data', label: 'Данные о товарах', disabled: true },
    ],
  },
  {
    key: 'grp-pricing',
    icon: <DollarOutlined />,
    label: 'Ценообразование',
    children: [
      { key: 'pricing-prices', label: 'Цены', disabled: true },
      { key: 'pricing-special', label: 'Спецпрайсы', disabled: true },
    ],
  },
  {
    key: 'grp-supplies',
    icon: <ShoppingOutlined />,
    label: 'Поставки',
    children: [
      { key: '/orders', label: 'Заказы' },
      { key: 'supplies-logistics', label: 'Логистика', disabled: true },
    ],
  },
  {
    key: 'grp-finance',
    icon: <BankOutlined />,
    label: 'Финансы',
    children: [
      { key: '/factoring', label: 'Факторинг' },
      { key: 'finance-recon', label: 'Сверка', disabled: true },
    ],
  },
  { key: '/knowledge-base', icon: <BookOutlined />, label: 'База знаний' },
];

const routeKeys = ['/orders', '/factoring', '/knowledge-base'];

export function AppSider() {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const selectedKey = routeKeys.find((r) => pathname.startsWith(r)) ?? '';
  const openKey =
    selectedKey === '/orders'
      ? 'grp-supplies'
      : selectedKey === '/factoring'
        ? 'grp-finance'
        : '';

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
        defaultOpenKeys={openKey ? [openKey] : []}
        items={items}
        onClick={({ key }) => {
          if (key.startsWith('/')) router.push(key);
        }}
        style={{ height: '100%', borderInlineEnd: 'none', background: ETM.dark }}
      />
    </Layout.Sider>
  );
}
