import { useQuery } from '@tanstack/react-query';
import { carouselApi } from '../api/carousel';

export const CAROUSEL_KEY = ['carousel'];

export function useCarousel() {
  return useQuery({
    queryKey: CAROUSEL_KEY,
    queryFn: carouselApi.getActive,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
  });
}
