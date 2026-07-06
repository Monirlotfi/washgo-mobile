import { useQuery } from '@tanstack/react-query';
import { washerApi } from '../api/washer';

export function useEarningsMonths() {
  return useQuery({
    queryKey: ['washer', 'earnings', 'months'],
    queryFn: washerApi.getEarningsMonths,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useEarnings(year: number, month: number) {
  return useQuery({
    queryKey: ['washer', 'earnings', year, month],
    queryFn: () => washerApi.getEarnings(year, month),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}