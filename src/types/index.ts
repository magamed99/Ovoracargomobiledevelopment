export type UserRole = 'driver' | 'sender';

export type TripStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export type DocumentType = 'passport' | 'license' | 'vehicle_registration';

export type DocumentStatus = 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  avatar?: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  createdAt: string;
  language: 'ru' | 'tj';
}

export interface Document {
  id: string;
  userId: string;
  type: DocumentType;
  url: string;
  status: DocumentStatus;
  uploadedAt: string;
  verifiedAt?: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  capacity: number;
  images: string[];
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Trip {
  id: string;
  driverId: string;
  driver?: User;
  from: Location;
  to: Location;
  departureDate: string;
  price: number;
  currency: string;
  availableSeats?: number;
  cargoCapacity?: number;
  status: TripStatus;
  description?: string;
  createdAt: string;
  distance?: number;
  duration?: number;
}

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  passenger?: User;
  seats?: number;
  cargoWeight?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  text: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Review {
  id: string;
  authorId: string;
  author?: User;
  targetId: string;
  tripId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'trip' | 'message' | 'booking' | 'review' | 'system';
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface LocationUpdate {
  userId: string;
  tripId: string;
  location: Location;
  timestamp: string;
  speed?: number;
  heading?: number;
}
