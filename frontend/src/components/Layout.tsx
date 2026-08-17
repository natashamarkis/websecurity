import { Layout as AntLayout, Menu, Button, Avatar, Dropdown } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  MessageOutlined,
  PlusOutlined,
  DashboardOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import './Layout.scss';

const { Header, Content, Footer } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to={`/profile/${user?.id}`}>Profile</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">Settings</Link>,
    },
    ...(user?.role === 'admin'
      ? [
          {
            key: 'admin',
            icon: <DashboardOutlined />,
            label: <Link to="/admin">Admin Panel</Link>,
          },
        ]
      : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout className="app-layout">
      <Header className="app-layout__header">
        <div className="app-layout__nav">
          <Link to="/" className="app-layout__brand">
            VulnApp
          </Link>
          <Menu
            theme="dark"
            mode="horizontal"
            items={[
              { key: 'home', icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
              ...(user
                ? [
                    {
                      key: 'create',
                      icon: <PlusOutlined />,
                      label: <Link to="/create-post">Create Post</Link>,
                    },
                    {
                      key: 'messages',
                      icon: <MessageOutlined />,
                      label: <Link to="/messages">Messages</Link>,
                    },
                  ]
                : []),
            ]}
          />
        </div>

        <div>
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="app-layout__user">
                <Avatar src={user.avatar} icon={<UserOutlined />} />
                <span className="app-layout__user-name">{user.username}</span>
              </div>
            </Dropdown>
          ) : (
            <div className="app-layout__auth">
              <Button type="link" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button type="primary" onClick={() => navigate('/register')}>
                Register
              </Button>
            </div>
          )}
        </div>
      </Header>

      <Content className="app-layout__content">{children}</Content>

      <Footer className="app-layout__footer">
        VulnApp ©2026 - Educational Security Demo
      </Footer>
    </AntLayout>
  );
};
