// Утилита для работы с Push уведомлениями

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Проверка поддержки браузером
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Получить текущий статус разрешений
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Запросить разрешение на отправку уведомлений
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('[PushNotifications] ⚠️ Push notifications not supported');
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      console.log('[PushNotifications] 🔔 Permission status:', this.permission);
      return this.permission;
    } catch (error) {
      console.error('[PushNotifications] ❌ Error requesting permission:', error);
      return 'denied';
    }
  }

  /**
   * Зарегистрировать Service Worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PushNotifications] ⚠️ Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      console.log('[PushNotifications] ✅ Service Worker registered');
      return this.registration;
    } catch (error) {
      console.error('[PushNotifications] ❌ Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Отправить локальное уведомление
   */
  async sendNotification(options: PushNotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      console.warn('[PushNotifications] ⚠️ Permission not granted');
      return;
    }

    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      console.error('[PushNotifications] ❌ No Service Worker registration');
      return;
    }

    try {
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/icon-192.png',
        tag: options.tag || `notification-${Date.now()}`,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        vibrate: options.vibrate || [200, 100, 200],
        actions: options.actions || [],
      };

      await this.registration.showNotification(options.title, notificationOptions);
      console.log('[PushNotifications] ✅ Notification sent:', options.title);
    } catch (error) {
      console.error('[PushNotifications] ❌ Error sending notification:', error);
    }
  }

  /**
   * Проверить, есть ли активные уведомления
   */
  async getNotifications(): Promise<Notification[]> {
    if (!this.registration) {
      return [];
    }

    return await this.registration.getNotifications();
  }

  /**
   * Закрыть все уведомления с определенным тегом
   */
  async closeNotifications(tag?: string): Promise<void> {
    if (!this.registration) {
      return;
    }

    const notifications = await this.registration.getNotifications(tag ? { tag } : undefined);
    notifications.forEach((notification) => notification.close());
    console.log('[PushNotifications] 🔕 Closed notifications:', notifications.length);
  }
}

// Создаем singleton instance
export const pushNotificationService = new PushNotificationService();

// Хелперы для быстрой отправки типовых уведомлений
export const sendQuickNotification = {
  /**
   * Новое сообщение в чате
   */
  newMessage: async (senderName: string, message: string, chatId: string) => {
    await pushNotificationService.sendNotification({
      title: `💬 ${senderName}`,
      body: message,
      tag: `chat-${chatId}`,
      data: { type: 'message', chatId },
      actions: [
        { action: 'reply', title: 'Ответить' },
        { action: 'close', title: 'Закрыть' },
      ],
    });
  },

  /**
   * Новая заявка на поездку
   */
  newProposal: async (senderName: string, route: string, proposalId: string) => {
    await pushNotificationService.sendNotification({
      title: '📦 Новая заявка!',
      body: `${senderName} подал заявку на поездку ${route}`,
      tag: `proposal-${proposalId}`,
      data: { type: 'proposal', proposalId },
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'Посмотреть' },
        { action: 'close', title: 'Позже' },
      ],
    });
  },

  /**
   * Заявка принята
   */
  proposalAccepted: async (driverName: string, route: string, tripId: string) => {
    await pushNotificationService.sendNotification({
      title: '✅ Заявка принята!',
      body: `${driverName} принял вашу заявку на ${route}`,
      tag: `trip-${tripId}`,
      data: { type: 'trip', tripId },
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'Открыть' },
        { action: 'close', title: 'ОК' },
      ],
    });
  },

  /**
   * Поездка начинается
   */
  tripStarting: async (route: string, time: string, tripId: string) => {
    await pushNotificationService.sendNotification({
      title: '🚗 Поездка начинается!',
      body: `${route} отправление в ${time}`,
      tag: `trip-start-${tripId}`,
      data: { type: 'trip-start', tripId },
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
    });
  },

  /**
   * Груз доставлен
   */
  tripCompleted: async (route: string, tripId: string) => {
    await pushNotificationService.sendNotification({
      title: '🎉 Груз доставлен!',
      body: `Поездка ${route} успешно завершена`,
      tag: `trip-complete-${tripId}`,
      data: { type: 'trip-complete', tripId },
      actions: [
        { action: 'review', title: 'Оставить отзыв' },
        { action: 'close', title: 'Закрыть' },
      ],
    });
  },

  /**
   * Новый отзыв
   */
  newReview: async (authorName: string, rating: number) => {
    await pushNotificationService.sendNotification({
      title: '⭐ Новый отзыв!',
      body: `${authorName} оставил отзыв: ${rating}/5`,
      tag: 'review',
      data: { type: 'review' },
    });
  },

  /**
   * Системное уведомление
   */
  system: async (title: string, body: string) => {
    await pushNotificationService.sendNotification({
      title: `🔔 ${title}`,
      body,
      tag: 'system',
      data: { type: 'system' },
    });
  },
};

// Инициализация при загрузке
export const initPushNotifications = async (): Promise<boolean> => {
  if (!pushNotificationService.isSupported()) {
    console.warn('[PushNotifications] ⚠️ Not supported in this browser');
    return false;
  }

  // Проверяем текущее разрешение
  const currentPermission = pushNotificationService.getPermission();
  
  if (currentPermission === 'granted') {
    await pushNotificationService.registerServiceWorker();
    console.log('[PushNotifications] ✅ Already initialized');
    return true;
  }

  if (currentPermission === 'denied') {
    console.warn('[PushNotifications] ⚠️ Permission denied');
    return false;
  }

  // Если разрешение еще не запрашивалось, не запрашиваем автоматически
  // Пользователь должен сам нажать кнопку
  console.log('[PushNotifications] ℹ️ Permission not requested yet');
  return false;
};

// Экспорт для использования в компонентах
export default pushNotificationService;
