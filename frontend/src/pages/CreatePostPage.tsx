import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { postsService } from '@/services/posts';

const { TextArea } = Input;

const CreatePostPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { title: string; content: string }) => {
    setLoading(true);
    try {
      const data = await postsService.createPost(values.title, values.content);
      message.success('Post created successfully!');
      navigate(`/post/${data.postId}`);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <>
        <h1>Create New Post</h1>
        <Card>
          <Form name="createPost" onFinish={onFinish} layout="vertical">
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title!' }]}
            >
              <Input placeholder="Enter post title" size="large" />
            </Form.Item>

            <Form.Item
              name="content"
              label="Content"
              rules={[{ required: true, message: 'Please enter content!' }]}
            >
              <TextArea rows={10} placeholder="Write your post content..." />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                Create Post
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={() => navigate('/')}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </>
    </Layout>
  );
};

export default CreatePostPage;
