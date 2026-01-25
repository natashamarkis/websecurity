import { useState, useEffect } from 'react';
import { Input, List, Card, Avatar, Button, message, Tag } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { postsService } from '@/services/posts';
import type { Post } from '@/services/types';

const { Search } = Input;

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPosts = async (query?: string) => {
    setLoading(true);
    try {
      const data = await postsService.getAllPosts(query);
      setPosts(data.posts);

      // VULNERABILITY: Reflected XSS - displaying search query without sanitization
      if (data.searchQuery) {
        setSearchQuery(data.searchQuery);
      }
    } catch (error) {
      message.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleSearch = (value: string) => {
    loadPosts(value);
  };

  return (
    <Layout>
      <div style={{ width: '100%' }}>
        <h1>Latest Posts</h1>

        <Search
          placeholder="Search posts..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          style={{ marginBottom: 24 }}
        />

        {searchQuery && (
          <div style={{ marginBottom: 16 }}>
            {/* VULNERABILITY: Reflected XSS through dangerouslySetInnerHTML */}
            <Tag>
              Search results for: <span dangerouslySetInnerHTML={{ __html: searchQuery }} />
            </Tag>
          </div>
        )}

        <List
          loading={loading}
          itemLayout="vertical"
          dataSource={posts}
          renderItem={(post) => (
            <Card style={{ marginBottom: 16 }}>
              <Card.Meta
                avatar={<Avatar src={post.avatar} icon={<UserOutlined />} />}
                title={<Link to={`/post/${post.id}`}>{post.title}</Link>}
                description={
                  <div>
                    <div>By {post.username}</div>
                    <div style={{ marginTop: 8, color: '#888' }}>
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                }
              />
              <div style={{ marginTop: 16 }}>
                {post.content.substring(0, 200)}
                {post.content.length > 200 && '...'}
              </div>
              <div style={{ marginTop: 16 }}>
                <Link to={`/post/${post.id}`}>
                  <Button type="link">Read more →</Button>
                </Link>
              </div>
            </Card>
          )}
        />
      </div>
    </Layout>
  );
};

export default HomePage;
