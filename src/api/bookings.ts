import { apiClient } from './client';
import {
  Booking,
  BookingHistoryItem,
  CancellationReason,
  CreateBookingResponse,
} from '../types/api.types';

export const bookingsApi = {
  create: async (data: {
    vehicleId: string;
    addressLabel: string;
    lat: number;
    lng: number;
    washType?: 'BASIC' | 'PREMIUM' | 'VIP';
    notes?: string;
  }): Promise<CreateBookingResponse> => {
    const res = await apiClient.post<CreateBookingResponse>('/bookings', data);
    return res.data;
  },

  list: async (): Promise<Booking[]> => {
    const res = await apiClient.get<Booking[]>('/bookings');
    return res.data;
  },

  history: async (): Promise<BookingHistoryItem[]> => {
    const res = await apiClient.get<BookingHistoryItem[]>('/bookings/history');
    return res.data;
  },

  get: async (id: string): Promise<Booking> => {
    const res = await apiClient.get<Booking>(`/bookings/${id}`);
    return res.data;
  },

  cancel: async (
    id: string,
    reason: CancellationReason,
    customReason?: string,
  ) => {
    await apiClient.delete(`/bookings/${id}`, {
      data: { reason, customReason },
    });
  },
  confirmCompletion: async (id: string): Promise<Booking> => {
    const res = await apiClient.post<Booking>(
      `/bookings/${id}/confirm-completion`,
    );
    return res.data;
  },
  getPricing: async (vehicleId: string): Promise<{
    BASIC: number;
    PREMIUM: number;
    VIP: number;
  }> => {
    const res = await apiClient.get(`/bookings/pricing/${vehicleId}`);
    return res.data;
  },
};