import { useState } from 'react';
import { Form, Input, Button, Card, Alert, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import './LoginPage.scss';

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
      <div className="login-page__container">
        <Card title="Login" className="login-page__card">
          {error && <Alert message={error} type="error" className="login-page__alert" />}

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

            <div className="login-page__footer">
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
            className="login-page__test-accounts"
          />
        </Card>
      </div>
    </Layout>
  );
};

export default LoginPage;
