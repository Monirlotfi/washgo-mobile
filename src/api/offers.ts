import { apiClient } from './client';
import {
  WasherOfferWithBooking,
  OfferWithWasher,
  Booking,
} from '../types/api.types';

export const offersApi = {
  /** Le laveur fait une offre */
  makeOffer: async (
    bookingId: string,
    proposedPriceMAD: number,
  ): Promise<{ id: string; proposedPriceMAD: number; estimatedEtaMin: number }> => {
    const res = await apiClient.post(
      `/washer/bookings/${bookingId}/offer`,
      { proposedPriceMAD },
    );
    return res.data;
  },

  /** Liste des offres en cours du laveur */
  myPendingOffers: async (): Promise<WasherOfferWithBooking[]> => {
    const res = await apiClient.get<WasherOfferWithBooking[]>(
      '/washer/offers/mine',
    );
    return res.data;
  },

  /** Liste des offres reçues sur un booking (côté client) */
  listForBooking: async (bookingId: string): Promise<OfferWithWasher[]> => {
    const res = await apiClient.get<OfferWithWasher[]>(
      `/bookings/${bookingId}/offers`,
    );
    return res.data;
  },

  /** Le client choisit une offre */
  chooseOffer: async (
    bookingId: string,
    offerId: string,
  ): Promise<Booking> => {
    const res = await apiClient.post<Booking>(
      `/bookings/${bookingId}/offers/${offerId}/choose`,
    );
    return res.data;
  },
};