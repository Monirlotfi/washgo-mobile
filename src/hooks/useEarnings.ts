import { useQuery } from '@tanstack/react-query';
import { washerApi } from '../api/washer';

export function useEarningsMonths() {
  return useQuery({
    queryKey: ['washer', 'earnings', 'months'],
    queryFn: washerApi.getEarningsMonths,
  });
}

export function useEarnings(year: number, month: number) {
  return useQuery({
    queryKey: ['washer', 'earnings', year, month],
    queryFn: () => washerApi.getEarnings(year, month),
  });
}