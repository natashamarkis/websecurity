import { useState } from 'react';
import { Form, Input, Button, Card, Alert, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');

    try {
      await login(values.username, values.password);
      message.success('Login successful!');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card title="Login" style={{ width: 400 }}>
          {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

          <Form name="login" onFinish={onFinish} layout="vertical">
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Log in
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              Don't have an account? <Link to="/register">Register now</Link>
            </div>
          </Form>

          <Alert
            message="Test Accounts"
            description={
              <div>
                <div>admin / admin123 (Admin)</div>
                <div>alice / alice123 (User)</div>
                <div>bob / bob123 (User)</div>
              </div>
            }
            type="info"
            style={{ marginTop: 16 }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default LoginPage;
