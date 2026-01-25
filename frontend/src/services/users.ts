import api from './api';
import type { User } from './types';

export const usersService = {
  async getUser(id: number): Promise<{ user: User }> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async updateProfile(id: number, email: string, bio: string) {
    const response = await api.put(`/users/${id}`, { email, bio });
    return response.data;
  },

  async uploadAvatar(id: number, file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async changePassword(id: number, currentPassword: string, newPassword: string) {
    const response = await api.post(`/users/${id}/change-password`, {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  async deleteAccount(id: number) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
