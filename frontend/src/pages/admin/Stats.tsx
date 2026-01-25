import { useState, useEffect } from 'react';
import { Card, Table, message, Tag } from 'antd';
import { Layout } from '@/components/Layout';
import { adminService } from '@/services/admin';
import './Stats.scss';

const Stats = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSessions();
      setSessions(data.sessions);
    } catch (error) {
      message.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const sessionColumns = [
    {
      title: 'Session ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      render: (token: string) => (
        <code className="admin-stats__token">{token.substring(0, 20)}...</code>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Last Active',
      dataIndex: 'last_active',
      key: 'last_active',
      render: (date: string) => {
        const lastActive = new Date(date);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / 60000);
        
        let color = 'green';
        if (diffMinutes > 30) color = 'orange';
        if (diffMinutes > 60) color = 'red';
        
        return (
          <Tag color={color}>
            {diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`}
          </Tag>
        );
      },
    },
  ];

  return (
    <Layout>
      <>
        <h1>Session Statistics</h1>

        <Card title="Active Sessions">
          <Table
            dataSource={sessions}
            columns={sessionColumns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </>
    </Layout>
  );
};

export default Stats;
