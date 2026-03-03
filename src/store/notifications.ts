import { create } from 'zustand';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  settings: {
    tripUpdates: boolean;
    messages: boolean;
    bookings: boolean;
    reviews: boolean;
  };
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationState['settings']>) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  settings: {
    tripUpdates: true,
    messages: true,
    bookings: true,
    reviews: true,
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock notifications
      const mockNotifications: Notification[] = [
        {
          id: 'notif1',
          userId: 'currentUser',
          title: 'Новое бронирование',
          body: 'Пассажир забронировал место в вашей поездке',
          type: 'booking',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'notif2',
          userId: 'currentUser',
          title: 'Новое сообщение',
          body: 'У вас новое сообщение от водителя',
          type: 'message',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];

      const unreadCount = mockNotifications.filter(n => !n.read).length;

      set({ notifications: mockNotifications, unreadCount, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  markAsRead: async (id) => {
    try {
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      throw error;
    }
  },

  updateSettings: (settings) => {
    set(state => ({
      settings: { ...state.settings, ...settings },
    }));
  },
}));
