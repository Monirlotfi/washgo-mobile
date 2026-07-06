import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { washerApi } from '../api/washer';

export const WASHER_DASHBOARD_KEY = ['washer', 'dashboard'];
export const WASHER_AVAILABLE_KEY = ['washer', 'available'];
export const WASHER_BOOKINGS_KEY = ['washer', 'bookings'];

export function useWasherDashboard() {
  return useQuery({
    queryKey: WASHER_DASHBOARD_KEY,
    queryFn: washerApi.getDashboard,
    staleTime: 8 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 15000,
  });
}

export function useAvailableBookings(enabled: boolean = true) {
  return useQuery({
    queryKey: WASHER_AVAILABLE_KEY,
    queryFn: washerApi.getAvailableBookings,
    //refetchInterval: enabled ? 10000 : false,
    refetchInterval: enabled ? 15000 : false,
    staleTime: 8 * 1000,
    gcTime: 2 * 60 * 1000,
    enabled,
  });
}

export function useMyWasherBookings() {
  return useQuery({
    queryKey: WASHER_BOOKINGS_KEY,
    queryFn: washerApi.getMyBookings,
    staleTime: 5 * 1000,
    gcTime: 2 * 60 * 1000,
    //refetchInterval: 5000,
    refetchInterval: (query) => {
      if (!query.state.data) return 5000;
      const activeStatuses = ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CLIENT_CONFIRMATION'];
      const hasActive = query.state.data.some((b) => activeStatuses.includes(b.status));
      return hasActive ? 5000 : 15000;
    },
  });
}

export function useActiveWasherBooking() {
  return useQuery({
    queryKey: WASHER_BOOKINGS_KEY,
    queryFn: washerApi.getMyBookings,
    staleTime: 5 * 1000,
    gcTime: 2 * 60 * 1000,
    select: (data) => {
      const active = data.find((b) =>
        ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CLIENT_CONFIRMATION'].includes(b.status),
      );
      return active ?? null;
    },
    refetchInterval: (query) => {
      return query.state.data ? 5000 : 10000;
    },
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

export function useWasherBooking(id: string | null) {
  return useQuery({
    queryKey: WASHER_BOOKINGS_KEY,
    queryFn: washerApi.getMyBookings,
    staleTime: 5 * 1000,
    gcTime: 2 * 60 * 1000,
    select: (data) => data.find((b) => b.id === id) ?? null,
    enabled: !!id,
    refetchInterval: 5000,
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