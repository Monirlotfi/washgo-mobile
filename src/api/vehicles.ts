import { apiClient } from './client';
import { Vehicle, VehicleCategory, VehicleSize } from '../types/api.types';

export const vehiclesApi = {
  list: async (): Promise<Vehicle[]> => {
    const res = await apiClient.get<Vehicle[]>('/vehicles');
    return res.data;
  },

  create: async (data: {
    brand: string;
    model: string;
    plate: string;
    category: VehicleCategory;
    size?: VehicleSize;
  }): Promise<Vehicle> => {
    const res = await apiClient.post<Vehicle>('/vehicles', data);
    return res.data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/vehicles/${id}`);
  },
};