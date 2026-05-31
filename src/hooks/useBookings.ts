import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookings';
import { CancellationReason } from '../types/api.types';

export const BOOKINGS_KEY = ['bookings'];
export const BOOKINGS_HISTORY_KEY = ['bookings', 'history'];
export const bookingKey = (id: string) => ['bookings', id];

export function useBookings() {
  return useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: bookingsApi.list,
  });
}

export function useBookingsHistory() {
  return useQuery({
    queryKey: BOOKINGS_HISTORY_KEY,
    queryFn: bookingsApi.history,
  });
}

export function useBooking(id: string | null) {
  return useQuery({
    queryKey: bookingKey(id ?? ''),
    queryFn: () => bookingsApi.get(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useActiveBooking() {
  return useQuery({
    queryKey: [...BOOKINGS_KEY, 'active'],
    queryFn: async () => {
      const list = await bookingsApi.list();
      const active = list.find((b) =>
        ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CLIENT_CONFIRMATION'].includes(b.status),
      );
      return active ?? null;
    },
    refetchInterval: 5000,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reason,
      customReason,
    }: {
      id: string;
      reason: CancellationReason;
      customReason?: string;
    }) => bookingsApi.cancel(id, reason, customReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      qc.invalidateQueries({ queryKey: BOOKINGS_HISTORY_KEY });
    },
  });
}
export function useConfirmCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingsApi.confirmCompletion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      qc.invalidateQueries({ queryKey: BOOKINGS_HISTORY_KEY });
    },
  });
}
export function useVehiclePricing(vehicleId: string | null) {
  return useQuery({
    queryKey: ['booking-pricing', vehicleId],
    queryFn: () => bookingsApi.getPricing(vehicleId!),
    enabled: !!vehicleId,
  });
}