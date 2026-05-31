import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { washerApi } from '../api/washer';

export const WASHER_AVAILABLE_KEY = ['washer', 'available'];
export const WASHER_BOOKINGS_KEY = ['washer', 'bookings'];

export function useAvailableBookings(enabled: boolean = true) {
  return useQuery({
    queryKey: WASHER_AVAILABLE_KEY,
    queryFn: washerApi.getAvailableBookings,
    refetchInterval: enabled ? 10000 : false,
    enabled,
  });
}

export function useMyWasherBookings() {
  return useQuery({
    queryKey: WASHER_BOOKINGS_KEY,
    queryFn: washerApi.getMyBookings,
    refetchInterval: 5000,
  });
}

export function useActiveWasherBooking() {
  return useQuery({
    queryKey: [...WASHER_BOOKINGS_KEY, 'active'],
    queryFn: async () => {
      const list = await washerApi.getMyBookings();
      const active = list.find((b) =>
        ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CLIENT_CONFIRMATION'].includes(b.status),
      );
      return active ?? null;
    },
    refetchInterval: 5000,
  });
}


export function useMarkArrived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: washerApi.markArrived,
    onSuccess: () => qc.invalidateQueries({ queryKey: WASHER_BOOKINGS_KEY }),
  });
}

export function useStartWash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: washerApi.startWash,
    onSuccess: () => qc.invalidateQueries({ queryKey: WASHER_BOOKINGS_KEY }),
  });
}

export function useCompleteWash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: washerApi.completeWash,
    onSuccess: () => qc.invalidateQueries({ queryKey: WASHER_BOOKINGS_KEY }),
  });
}
export function useWasherCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reason,
      customReason,
    }: {
      id: string;
      reason: 'MECHANICAL_ISSUE' | 'PERSONAL_EMERGENCY' | 'HEALTH_ISSUE' | 'OTHER';
      customReason?: string;
    }) => washerApi.cancelBooking(id, reason, customReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WASHER_BOOKINGS_KEY });
    },
  });
}