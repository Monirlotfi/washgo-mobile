import { apiClient } from './client';
import { Rating } from '../types/api.types';

export const ratingsApi = {
  rate: async (
    bookingId: string,
    score: number,
    comment?: string,
  ): Promise<Rating> => {
    const res = await apiClient.post<Rating>(
      `/bookings/${bookingId}/rate`,
      { score, comment },
    );
    return res.data;
  },

  getByBooking: async (bookingId: string): Promise<Rating | null> => {
    const res = await apiClient.get<Rating | null>(
      `/bookings/${bookingId}/rating`,
    );
    return res.data;
  },
};