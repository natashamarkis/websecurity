import api from './api';
import type { Message } from './types';

export const messagesService = {
  async getConversations() {
    const response = await api.get('/messages');
    return response.data;
  },

  async getMessages(userId: number): Promise<{ messages: Message[] }> {
    const response = await api.get(`/messages/${userId}`);
    return response.data;
  },

  async sendMessage(toUserId: number, text: string) {
    const response = await api.post('/messages', { toUserId, text });
    return response.data;
  },
};
