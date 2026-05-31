import { apiClient } from './client';
import { AuthResponse } from '../types/api.types';

export const authApi = {
  registerClient: async (data: {
    phone: string;
    email?: string;
    password: string;
    fullName: string;
    firebaseIdToken: string;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register/client', data);
    return res.data;
  },

  registerWasher: async (data: {
    fullName: string;
    phone: string;
    password: string;
    equipmentType: 'TRIPORTEUR' | 'MINIVAN' | 'MOBILE';
    licensePlate?: string;
    cinPhotoUri: string;
    firebaseIdToken: string;
  }): Promise<void> => {
    // Multipart/form-data pour envoyer la photo CIN
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('phone', data.phone);
    formData.append('password', data.password);
    formData.append('equipmentType', data.equipmentType);
    formData.append('firebaseIdToken', data.firebaseIdToken);
    if (data.licensePlate) formData.append('licensePlate', data.licensePlate);

    // Photo CIN
    const filename = data.cinPhotoUri.split('/').pop() ?? 'cin.jpg';
    formData.append('cinPhoto', {
      uri: data.cinPhotoUri,
      name: filename,
      type: 'image/jpeg',
    } as any);

    await apiClient.post('/auth/register/washer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  login: async (data: {
    phone: string;
    password: string;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};