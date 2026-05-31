import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { offersApi } from '../api/offers';
import { BOOKINGS_KEY, bookingKey } from './useBookings';
import { WASHER_BOOKINGS_KEY } from './useWasher';

export const OFFERS_KEY = ['offers'];
export const MY_OFFERS_KEY = ['my-offers'];

/** Liste des offres reçues sur un booking (CLIENT) */
export function useBookingOffers(bookingId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...OFFERS_KEY, bookingId],
    queryFn: () => offersApi.listForBooking(bookingId!),
    enabled: !!bookingId && enabled,
    refetchInterval: 5000,
  });
}

/** Mes offres en cours (WASHER) */
export function useMyPendingOffers(enabled = true) {
  return useQuery({
    queryKey: MY_OFFERS_KEY,
    queryFn: () => offersApi.myPendingOffers(),
    enabled,
    refetchInterval: 5000,
  });
}

/** Faire une offre (WASHER) */
export function useMakeOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      priceMAD,
    }: {
      bookingId: string;
      priceMAD: number;
    }) => offersApi.makeOffer(bookingId, priceMAD),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_OFFERS_KEY });
      qc.invalidateQueries({ queryKey: WASHER_BOOKINGS_KEY });
    },
  });
}

/** Choisir une offre (CLIENT) */
export function useChooseOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      offerId,
    }: {
      bookingId: string;
      offerId: string;
    }) => offersApi.chooseOffer(bookingId, offerId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      qc.invalidateQueries({ queryKey: bookingKey(vars.bookingId) });
      qc.invalidateQueries({ queryKey: OFFERS_KEY });
    },
  });
}