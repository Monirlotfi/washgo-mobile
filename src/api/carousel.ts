import { apiClient } from './client';

export interface CarouselSlide {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string | null;
  textPosition: string;
  imageFit: string;
  order: number;
  active: boolean;
}

export const carouselApi = {
  getActive: async (): Promise<CarouselSlide[]> => {
    const res = await apiClient.get<CarouselSlide[]>('/carousel');
    return res.data;
  },
};
