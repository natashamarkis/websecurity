import api from './api';
import { Post, Comment } from './types';

export const postsService = {
  async getAllPosts(searchQuery?: string): Promise<{ posts: Post[]; searchQuery?: string }> {
    const response = await api.get('/posts', { params: { q: searchQuery } });
    return response.data;
  },

  async getPost(id: number): Promise<{ post: Post; comments: Comment[] }> {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  async createPost(title: string, content: string) {
    const response = await api.post('/posts', { title, content });
    return response.data;
  },

  async deletePost(id: number) {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  async addComment(postId: number, text: string) {
    const response = await api.post('/comments', { postId, text });
    return response.data;
  },

  async deleteComment(id: number) {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },
};
