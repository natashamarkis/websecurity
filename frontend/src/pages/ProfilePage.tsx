import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Avatar, Button, Descriptions, List, message, Spin } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { usersService } from '@/services/users';
import { postsService } from '@/services/posts';
import type { User, Post } from '@/services/types';
import { useAuth } from '@/contexts/AuthContext';

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    setLoading(true);
    Promise.all([
      usersService.getUser(parseInt(userId)),
      postsService.getAllPosts()
    ])
      .then(([userData, postsData]) => {
        setUser(userData.user);
        // Filter posts by this user
        setPosts(postsData.posts.filter(p => p.user_id === parseInt(userId)));
      })
      .catch(() => message.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Layout><div>User not found</div></Layout>;
  }

  const isOwnProfile = currentUser && currentUser.id === user.id;

  return (
    <Layout>
      <div style={{ width: '100%' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <Avatar size={100} src={user.avatar} icon={<UserOutlined />} />
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0 }}>{user.username}</h1>
              <div style={{ color: '#888', marginTop: '8px' }}>
                Member since {new Date(user.created_at || '').toLocaleDateString()}
              </div>
            </div>
            {isOwnProfile && (
              <Link to="/settings">
                <Button icon={<EditOutlined />}>Edit Profile</Button>
              </Link>
            )}
          </div>

          <Descriptions column={1}>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Role">{user.role}</Descriptions.Item>
            {user.bio && (
              <Descriptions.Item label="Bio">
                {/* VULNERABILITY: DOM-based XSS if bio contains HTML */}
                <div dangerouslySetInnerHTML={{ __html: user.bio }} />
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Posts">{user.postsCount || posts.length}</Descriptions.Item>
          </Descriptions>
        </Card>

        <h2 style={{ marginTop: '24px' }}>Posts by {user.username}</h2>
        <List
          dataSource={posts}
          renderItem={(post) => (
            <Card style={{ marginBottom: 16 }}>
              <Card.Meta
                title={<Link to={`/post/${post.id}`}>{post.title}</Link>}
                description={new Date(post.created_at).toLocaleString()}
              />
              <div style={{ marginTop: 16 }}>
                {post.content.substring(0, 150)}
                {post.content.length > 150 && '...'}
              </div>
            </Card>
          )}
        />
      </div>
    </Layout>
  );
};

export default ProfilePage;
