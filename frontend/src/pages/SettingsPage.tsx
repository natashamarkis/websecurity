import { useState } from 'react';
import { Form, Input, Button, Card, message, Popconfirm, Upload, Avatar } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { usersService } from '@/services/users';

const SettingsPage = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onUpdateProfile = async (values: { email: string; bio: string }) => {
    if (!user) return;
    setLoading(true);
    try {
      await usersService.updateProfile(user.id, values.email, values.bio);
      message.success('Profile updated successfully!');
      await refreshUser();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (values: { currentPassword: string; newPassword: string }) => {
    if (!user) return;
    setLoading(true);
    try {
      await usersService.changePassword(user.id, values.currentPassword, values.newPassword);
      message.success('Password changed successfully!');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    try {
      await usersService.uploadAvatar(user.id, file);
      message.success('Avatar uploaded successfully!');
      await refreshUser();
    } catch (error: any) {
      message.error('Failed to upload avatar');
    }
    return false; // Prevent default upload behavior
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await usersService.deleteAccount(user.id);
      message.success('Account deleted');
      await logout();
      navigate('/');
    } catch (error: any) {
      message.error('Failed to delete account');
    }
  };

  if (!user) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div style={{ width: '100%' }}>
        <h1>Settings</h1>

        <Card title="Profile Information" style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <Avatar size={80} src={user.avatar} icon={<UserOutlined />} />
            <Upload
              beforeUpload={handleAvatarUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} style={{ marginLeft: 16 }}>
                Upload Avatar
              </Button>
            </Upload>
          </div>

          <Form
            name="updateProfile"
            onFinish={onUpdateProfile}
            layout="vertical"
            initialValues={{ email: user.email, bio: user.bio }}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item name="bio" label="Bio">
              <Input.TextArea rows={4} placeholder="Tell us about yourself..." />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Profile
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Change Password" style={{ marginBottom: 24 }}>
          <Form name="changePassword" onFinish={onChangePassword} layout="vertical">
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[{ required: true, message: 'Please enter your current password!' }]}
            >
              <Input.Password size="large" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter a new password!' },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
            >
              <Input.Password size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Danger Zone" style={{ marginBottom: 24 }}>
          <Popconfirm
            title="Are you sure you want to delete your account?"
            description="This action cannot be undone!"
            onConfirm={handleDeleteAccount}
            okText="Yes, delete my account"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button danger>Delete Account</Button>
          </Popconfirm>
        </Card>
      </div>
    </Layout>
  );
};

export default SettingsPage;
