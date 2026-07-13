import { useQuery } from '@tanstack/react-query';
import { carouselApi } from '../api/carousel';

export const CAROUSEL_KEY = ['carousel'];

export function useCarousel() {
  return useQuery({
    queryKey: CAROUSEL_KEY,
    queryFn: carouselApi.getActive,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });
}
