export type UserRole = 'CLIENT' | 'WASHER' | 'ADMIN';
export type VehicleSize = 'SMALL' | 'MEDIUM' | 'SUV' | 'VAN';
export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'AWAITING_CLIENT_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  plate: string;
  size: VehicleSize;
  category: VehicleCategory | null;
  createdAt: string;
}

export interface NearbyWasher {
  washer_id: string;
  user_id: string;
  full_name: string;
  avg_rating: number;
  distance_meters: number;
}

export interface Booking {
  id: string;
  clientId: string;
  washerId: string | null;
  vehicleId: string;
  addressLabel: string;
  lat: number;
  lng: number;
  scheduledAt: string;
  acceptedAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: BookingStatus;
  priceMAD: number;
  notes: string | null;
  washType: WashType;
  estimatedDurationMin: number | null;
  washerCancelReason: WasherCancellationReason | null;
  reopenedAt: string | null;
  cancellationReason: string | null;
  cancelledBy: 'CLIENT' | 'WASHER' | 'SYSTEM' | null;
  photosBefore: string[];
  photosAfter: string[];
  vehicle?: Vehicle;
  washer?: {
    id: string;
    avgRating: number;
    totalBookings?: number;
    currentLat?: number;
    currentLng?: number;
    user: { fullName: string; phone: string };
  };
  rating?: Rating | null;
}

export interface CreateBookingResponse {
  booking: Booking;
  nearbyWashers: NearbyWasher[];
  matchedCount: number;
}

export type CancellationActor = 'CLIENT' | 'WASHER' | 'SYSTEM';

export type CancellationReason =
  | 'CONFLICT_WITH_WASHER'
  | 'WASHER_LATE'
  | 'CHANGED_MIND'
  | 'OTHER';

export interface BookingHistoryItem extends Booking {
  vehicle?: { brand: string; model: string; plate: string; size: VehicleSize };
  washer?: { user: { fullName: string; phone: string } };
}

export interface EarningsMonth {
  year: number;
  month: number;
  count: number;
}

export interface EarningsKpi {
  totalEarnedMAD: number;
  completedCount: number;
  cancelledCount: number;
  averagePerCourseMAD: number;
  lostMAD: number;
}

export interface EarningsBookingItem {
  id: string;
  status: BookingStatus;
  priceMAD: number;
  addressLabel: string;
  clientName: string;
  vehicleLabel: string;
  vehiclePlate: string;
  createdAt: string;
  completedAt: string | null;
  cancellationReason: string | null;
  cancelledBy: CancellationActor | null;
}

export interface EarningsResponse {
  year: number;
  month: number;
  kpi: EarningsKpi;
  bookings: EarningsBookingItem[];
}
export type WashType = 'BASIC' | 'PREMIUM' | 'VIP';

export type VehicleCategory = 'CITY_CAR' | 'LARGE_VEHICLE' | 'MOTORCYCLE';

export type WasherCancellationReason =
  | 'MECHANICAL_ISSUE'
  | 'PERSONAL_EMERGENCY'
  | 'HEALTH_ISSUE'
  | 'OTHER';

export interface PricingResponse {
  BASIC: number;
  PREMIUM: number;
  VIP: number;
}

export interface Rating {
  id: string;
  bookingId: string;
  authorId: string;
  score: number;
  comment: string | null;
  createdAt: string;
}
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface WasherOffer {
  id: string;
  bookingId: string;
  washerId: string;
  proposedPriceMAD: number;
  estimatedEtaMin: number;
  status: OfferStatus;
  createdAt: string;
}

export interface WasherOfferWithBooking extends WasherOffer {
  booking: {
    id: string;
    addressLabel: string;
    lat: number;
    lng: number;
    priceMAD: number; // prix suggéré
    washType: 'BASIC' | 'PREMIUM' | 'VIP';
    notes: string | null;
    status: BookingStatus;
    expiresAt: string | null;
    client: { fullName: string };
    vehicle: {
      brand: string;
      model: string;
      plate: string;
      size: string;
      category: string | null;
    };
  };
}

export interface OfferWithWasher extends WasherOffer {
  washer: {
    id: string;
    avgRating: number;
    totalBookings: number;
    currentLat: number | null;
    currentLng: number | null;
    user: { fullName: string };
  };
}