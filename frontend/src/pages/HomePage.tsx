import { useState, useEffect } from 'react';
import { Input, List, Card, Avatar, Button, message, Tag } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { postsService } from '@/services/posts';
import type { Post } from '@/services/types';
import './HomePage.scss';

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
      <>
        <h1>Latest Posts</h1>

        <Search
          placeholder="Search posts..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          className="home-page__search"
        />

        {searchQuery && (
          <div className="home-page__search-results">
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
            <Card className="home-page__post-card">
              <Card.Meta
                avatar={<Avatar src={post.avatar} icon={<UserOutlined />} />}
                title={<Link to={`/post/${post.id}`}>{post.title}</Link>}
                description={
                  <div>
                    <div>By {post.username}</div>
                    <div className="home-page__post-date">
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                }
              />
              <div className="home-page__excerpt">
                {post.content.substring(0, 200)}
                {post.content.length > 200 && '...'}
              </div>
              <div className="home-page__actions">
                <Link to={`/post/${post.id}`}>
                  <Button type="link">Read more →</Button>
                </Link>
              </div>
            </Card>
          )}
        />
      </>
    </Layout>
  );
};

export default HomePage;
