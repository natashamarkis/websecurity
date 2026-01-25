import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Avatar, Button, Input, List, message, Popconfirm } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { Layout } from '@/components/Layout';
import { postsService } from '@/services/posts';
import type { Post, Comment } from '@/services/types';
import { useAuth } from '@/contexts/AuthContext';

const { TextArea } = Input;

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPost = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await postsService.getPost(parseInt(id));
      setPost(data.post);
      setComments(data.comments);
    } catch (error) {
      message.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [id]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !id) return;

    setSubmitting(true);
    try {
      await postsService.addComment(parseInt(id), commentText);
      message.success('Comment added');
      setCommentText('');
      loadPost();
    } catch (error) {
      message.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!id) return;
    try {
      await postsService.deletePost(parseInt(id));
      message.success('Post deleted');
      navigate('/');
    } catch (error) {
      message.error('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await postsService.deleteComment(commentId);
      message.success('Comment deleted');
      loadPost();
    } catch (error) {
      message.error('Failed to delete comment');
    }
  };

  if (loading || !post) {
    return <Layout><div>Loading...</div></Layout>;
  }

  const canDeletePost = user && (user.id === post.user_id || user.role === 'admin');

  return (
    <Layout>
      <div style={{ width: '100%' }}>
        <Card>
          <Card.Meta
            avatar={<Avatar src={post.avatar} icon={<UserOutlined />} />}
            title={<h2>{post.title}</h2>}
            description={
              <div>
                <div>By {post.username}</div>
                <div style={{ color: '#888' }}>
                  {new Date(post.created_at).toLocaleString()}
                </div>
              </div>
            }
          />

          <div style={{ marginTop: 24, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </div>

          {canDeletePost && (
            <div style={{ marginTop: 16 }}>
              <Popconfirm
                title="Delete this post?"
                onConfirm={handleDeletePost}
                okText="Yes"
                cancelText="No"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete Post
                </Button>
              </Popconfirm>
            </div>
          )}
        </Card>

        <Card title={`Comments (${comments.length})`} style={{ marginTop: 24 }}>
          {user && (
            <div style={{ marginBottom: 24 }}>
              <TextArea
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
              />
              <Button
                type="primary"
                onClick={handleAddComment}
                loading={submitting}
                style={{ marginTop: 8 }}
              >
                Add Comment
              </Button>
            </div>
          )}

          <List
            dataSource={comments}
            renderItem={(comment) => {
              const canDelete = user && (user.id === comment.user_id || user.role === 'admin');

              return (
                <List.Item
                  actions={
                    canDelete
                      ? [
                          <Popconfirm
                            key="delete"
                            title="Delete this comment?"
                            onConfirm={() => handleDeleteComment(comment.id)}
                          >
                            <Button type="link" danger icon={<DeleteOutlined />} />
                          </Popconfirm>,
                        ]
                      : []
                  }
                >
                  <List.Item.Meta
                    avatar={<Avatar src={comment.avatar} icon={<UserOutlined />} />}
                    title={comment.username}
                    description={
                      <div style={{ color: '#888', fontSize: '12px' }}>
                        {new Date(comment.created_at).toLocaleString()}
                      </div>
                    }
                  />
                  {/* VULNERABILITY: Stored XSS - rendering comment text as HTML */}
                  <div dangerouslySetInnerHTML={{ __html: comment.text }} />
                </List.Item>
              );
            }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default PostDetailPage;
