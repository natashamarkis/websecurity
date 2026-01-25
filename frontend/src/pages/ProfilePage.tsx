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
import './ProfilePage.scss';

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
        <div className="profile-page__loading">
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
      <>
        <Card>
          <div className="profile-page__header">
            <Avatar size={100} src={user.avatar} icon={<UserOutlined />} />
            <div className="profile-page__meta">
              <h1 className="profile-page__username">{user.username}</h1>
              <div className="profile-page__since">
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

        <h2 className="profile-page__posts-title">Posts by {user.username}</h2>
        <List
          dataSource={posts}
          renderItem={(post) => (
            <Card className="profile-page__post-card">
              <Card.Meta
                title={<Link to={`/post/${post.id}`}>{post.title}</Link>}
                description={new Date(post.created_at).toLocaleString()}
              />
              <div className="profile-page__post-excerpt">
                {post.content.substring(0, 150)}
                {post.content.length > 150 && '...'}
              </div>
            </Card>
          )}
        />
      </>
    </Layout>
  );
};

export default ProfilePage;
