import { apiClient } from './client';

export const notificationsApi = {
  registerToken: async (pushToken: string) => {
    const res = await apiClient.post('/user/push-token', { pushToken });
    return res.data;
  },

  clearToken: async () => {
    const res = await apiClient.delete('/user/push-token');
    return res.data;
  },
};