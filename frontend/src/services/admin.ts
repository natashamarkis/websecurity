import api from './api';
import { User, DemoLog } from './types';

export const adminService = {
  async getUsers(): Promise<{ users: User[] }> {
    const response = await api.get('/admin/users');
    return response.data;
  },

  async getSessions() {
    const response = await api.get('/admin/sessions');
    return response.data;
  },

  async getStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  async getLogs(type?: string, limit = 50): Promise<{ logs: DemoLog[] }> {
    const response = await api.get('/admin/logs', { params: { type, limit } });
    return response.data;
  },

  async addLog(type: string, description: string, payload?: string) {
    const response = await api.post('/admin/logs', { type, description, payload });
    return response.data;
  },

  async clearLogs() {
    const response = await api.delete('/admin/logs');
    return response.data;
  },

  async resetDemo() {
    const response = await api.post('/admin/reset-demo');
    return response.data;
  },
};
