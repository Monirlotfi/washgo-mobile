import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingsApi } from '../api/ratings';
import { BOOKINGS_KEY, BOOKINGS_HISTORY_KEY, bookingKey } from './useBookings';

export function useRateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      score,
      comment,
    }: {
      bookingId: string;
      score: number;
      comment?: string;
    }) => ratingsApi.rate(bookingId, score, comment),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      qc.invalidateQueries({ queryKey: BOOKINGS_HISTORY_KEY });
      qc.invalidateQueries({ queryKey: bookingKey(variables.bookingId) });
    },
  });
}