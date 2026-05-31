import { apiClient } from './client';
import { User } from '../types/api.types';

export const userApi = {
  updateProfile: async (data: {
    fullName?: string;
    email?: string;
  }): Promise<User> => {
    const res = await apiClient.patch<User>('/user/profile', data);
    return res.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const res = await apiClient.post('/user/change-password', data);
    return res.data;
  },
};