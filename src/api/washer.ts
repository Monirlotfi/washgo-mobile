import { apiClient } from './client';
import {
  Booking,
  EarningsMonth,
  EarningsResponse,
} from '../types/api.types';

export interface AvailableBooking {
  booking_id: string;
  client_name: string;
  client_phone: string;
  address_label: string;
  lat: number;
  lng: number;
  scheduled_at: string;
  price_mad: number;
  notes: string | null;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_size: string;
  vehicle_category: string | null;
  wash_type: string;
  expires_at: string | null;
  distance_meters: number;
}

export interface WasherStatusResponse {
  id: string;
  status: 'AVAILABLE' | 'OFFLINE' | 'BUSY';
  currentLat: number | null;
  currentLng: number | null;
}

export const washerApi = {
  updateLocation: async (lat: number, lng: number) => {
    const res = await apiClient.patch('/washer/location', { lat, lng });
    return res.data;
  },

  setAvailability: async (status: 'AVAILABLE' | 'OFFLINE') => {
    const res = await apiClient.post<WasherStatusResponse>(
      '/washer/availability',
      { status },
    );
    return res.data;
  },

  getAvailableBookings: async (): Promise<AvailableBooking[]> => {
    const res = await apiClient.get<AvailableBooking[]>(
      '/washer/bookings/available',
    );
    return res.data;
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const res = await apiClient.get<Booking[]>('/washer/bookings');
    return res.data;
  },

  getEarningsMonths: async (): Promise<EarningsMonth[]> => {
    const res = await apiClient.get<EarningsMonth[]>('/washer/earnings/months');
    return res.data;
  },

  getEarnings: async (year: number, month: number): Promise<EarningsResponse> => {
    const res = await apiClient.get<EarningsResponse>('/washer/earnings', {
      params: { year, month },
    });
    return res.data;
  },

  acceptBooking: async (id: string): Promise<Booking> => {
    const res = await apiClient.post<Booking>(`/washer/bookings/${id}/accept`);
    return res.data;
  },

  markArrived: async (id: string): Promise<Booking> => {
    const res = await apiClient.post<Booking>(`/washer/bookings/${id}/arrived`);
    return res.data;
  },

  startWash: async (id: string): Promise<Booking> => {
    const res = await apiClient.post<Booking>(`/washer/bookings/${id}/start`);
    return res.data;
  },

  completeWash: async (id: string): Promise<Booking> => {
    const res = await apiClient.post<Booking>(`/washer/bookings/${id}/complete`);
    return res.data;
  },
  cancelBooking: async (
    id: string,
    reason: 'MECHANICAL_ISSUE' | 'PERSONAL_EMERGENCY' | 'HEALTH_ISSUE' | 'OTHER',
    customReason?: string,
  ) => {
    const res = await apiClient.post(`/washer/bookings/${id}/cancel`, {
      reason,
      customReason,
    });
    return res.data;
  },
};