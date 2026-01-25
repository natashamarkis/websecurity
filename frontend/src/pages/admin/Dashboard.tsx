import { useState, useEffect } from 'react';
import { Card, Table, Button, message, Statistic, Row, Col } from 'antd';
import { UserOutlined, FileTextOutlined, MessageOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Layout } from '@/components/Layout';
import { adminService } from '@/services/admin';
import type { User } from '@/services/types';
import './Dashboard.scss';

const Dashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getStats()
      ]);
      setUsers(usersData.users);
      setStats(statsData.stats);
    } catch (error) {
      message.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <span
          className={
            role === 'admin'
              ? 'admin-dashboard__role admin-dashboard__role--admin'
              : 'admin-dashboard__role admin-dashboard__role--user'
          }
        >
          {role}
        </span>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <Layout>
      <>
        <h1>Admin Dashboard</h1>

        <Row gutter={16} className="admin-dashboard__stats">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={stats.users || 0}
                prefix={<UserOutlined />}
                className="admin-dashboard__stat admin-dashboard__stat--users"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Posts"
                value={stats.posts || 0}
                prefix={<FileTextOutlined />}
                className="admin-dashboard__stat admin-dashboard__stat--posts"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Comments"
                value={stats.comments || 0}
                prefix={<MessageOutlined />}
                className="admin-dashboard__stat admin-dashboard__stat--comments"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Sessions"
                value={stats.activeSessions || 0}
                prefix={<ClockCircleOutlined />}
                className="admin-dashboard__stat admin-dashboard__stat--sessions"
              />
            </Card>
          </Col>
        </Row>

        <Card title="All Users">
          <Table
            dataSource={users}
            columns={userColumns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </>
    </Layout>
  );
};

export default Dashboard;
