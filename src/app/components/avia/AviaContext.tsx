import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import type { AviaUser, AviaNotification } from '../../api/aviaApi';
import { getAviaSession, saveAviaSession, clearAviaSession, getAviaProfile, getAviaNotifications, checkAviaUnread } from '../../api/aviaApi';
import { getAviaUserChats } from '../../api/aviaChatApi';

// ── Типы ─────────────────────────────────────────────────────────────────────

interface AviaContextType {
  user: AviaUser | null;
  loading: boolean;
  isAuth: boolean;
  login: (user: AviaUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserLocal: (updates: Partial<AviaUser>) => void;
  // Notifications
  notifications: AviaNotification[];
  unreadCount: number;
  refreshNotifications: () => void;
  updateNotifications: (notifs: AviaNotification[]) => void;
  // Chat unread
  chatUnreadCount: number;
  refreshChatUnread: () => void;
  // Passport warning
  passportDaysLeft: number | null;
}

const AviaContext = createContext<AviaContextType | undefined>(undefined);

// ── Вычислить дней до истечения паспорта ─────────────────────────────────────
function getDaysLeft(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  try {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.floor(diff / 86_400_000);
  } catch {
    return null;
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AviaProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                   = useState<AviaUser | null>(null);
  const [loading, setLoading]             = useState(true);
  const [notifications, setNotifications] = useState<AviaNotification[]>([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Refs для polling (избегаем closure-захвата устаревшего phone)
  const phoneRef       = useRef<string>('');
  const prevUnreadRef  = useRef<number>(-1); // -1 = неизвестно (первый запуск)
  const notifTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef       = useRef<AbortController | null>(null);

  // При монтировании — восстанавливаем сессию
  useEffect(() => {
    const session = getAviaSession();
    if (session?.user?.phone) {
      console.log('[AviaContext] Restoring session for:', session.phone);
      setUser(session.user);
      // Фоновое обновление из БД
      getAviaProfile(session.phone)
        .then((freshUser) => {
          if (freshUser) {
            setUser(freshUser);
            saveAviaSession(session.phone, freshUser);
          }
        })
        .catch((e) => console.warn('[AviaContext] Background refresh failed:', e));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    phoneRef.current = user?.phone || '';
  }, [user?.phone]);

  // ── Smart notification polling ──────────────────────────────────────────────
  // Шаг 1: каждые 15с — лёгкий check (возвращает только число непрочитанных)
  // Шаг 2: если count изменился — тянем полный список (тяжёлый запрос)
  // Результат: 95%+ polling-вызовов = ~30 байт вместо нескольких килобайт

  const fetchFullNotifications = useCallback(async (signal?: AbortSignal) => {
    const phone = phoneRef.current;
    if (!phone) return;
    try {
      const notifs = await getAviaNotifications(phone, signal);
      if (signal?.aborted) return;
      setNotifications(notifs);
      prevUnreadRef.current = notifs.filter(n => n.isUnread).length;
    } catch (e) {
      if (!(e as any)?.name?.includes('Abort')) {
        console.warn('[AviaContext] fetchFullNotifications failed:', e);
      }
    }
  }, []);

  const smartPollNotifications = useCallback(async (signal?: AbortSignal) => {
    const phone = phoneRef.current;
    if (!phone) return;
    if (signal?.aborted) return;
    // Вкладка скрыта — не опрашиваем (экономим батарею/трафик)
    if (document.visibilityState === 'hidden') return;

    try {
      const unreadCount = await checkAviaUnread(phone, signal);
      if (signal?.aborted) return;

      // Первый запрос ИЛИ счётчик изменился — тянем полный список
      if (prevUnreadRef.current === -1 || unreadCount !== prevUnreadRef.current) {
        await fetchFullNotifications(signal);
      }
      // Иначе: всё то же самое, пропускаем тяжёлый запрос
    } catch (e) {
      if (!(e as any)?.name?.includes('Abort')) {
        console.warn('[AviaContext] smartPollNotifications failed:', e);
      }
    }
  }, [fetchFullNotifications]);

  const fetchChatUnread = useCallback(async (signal?: AbortSignal) => {
    const phone = phoneRef.current;
    if (!phone) return;
    if (document.visibilityState === 'hidden') return;
    try {
      const chats = await getAviaUserChats(phone);
      if (signal?.aborted) return;
      setChatUnreadCount(chats.reduce((s, c) => s + (c.unread || 0), 0));
    } catch (e) {
      if (!(e as any)?.name?.includes('Abort')) {
        console.warn('[AviaContext] chatUnread poll failed:', e);
      }
    }
  }, []);

  // ── Запускаем polling при авторизации ──────────────────────────────────────
  useEffect(() => {
    if (!user?.phone) {
      prevUnreadRef.current = -1;
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    // Немедленный первый запрос
    smartPollNotifications(signal);
    fetchChatUnread(signal);

    // Интервалы: уведомления каждые 15с, чат каждые 30с
    notifTimerRef.current = setInterval(() => smartPollNotifications(signal), 15_000);
    chatTimerRef.current  = setInterval(() => fetchChatUnread(signal), 30_000);

    // Возобновляем при переключении обратно на вкладку
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        smartPollNotifications(signal);
        fetchChatUnread(signal);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      controller.abort();
      abortRef.current = null;
      if (notifTimerRef.current) clearInterval(notifTimerRef.current);
      if (chatTimerRef.current)  clearInterval(chatTimerRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.phone, smartPollNotifications, fetchChatUnread]);

  // ── Методы ─────────────────────────────────────────────────────────────────

  const login = (userData: AviaUser) => {
    setUser(userData);
    saveAviaSession(userData.phone, userData);
  };

  const logout = () => {
    setUser(null);
    setNotifications([]);
    prevUnreadRef.current = -1;
    clearAviaSession();
  };

  const refreshUser = async () => {
    const session = getAviaSession();
    if (!session?.phone) return;
    try {
      const freshUser = await getAviaProfile(session.phone);
      if (freshUser) {
        setUser(freshUser);
        saveAviaSession(session.phone, freshUser);
      }
    } catch (e) {
      console.error('[AviaContext] refreshUser failed:', e);
    }
  };

  const updateUserLocal = (updates: Partial<AviaUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updates };
      saveAviaSession(prev.phone, merged);
      return merged;
    });
  };

  // Принудительно загрузить полный список уведомлений (после действия пользователя)
  const refreshNotifications = useCallback(() => {
    prevUnreadRef.current = -1; // форсируем полный fetch
    fetchFullNotifications(abortRef.current?.signal);
  }, [fetchFullNotifications]);

  const updateNotifications = (notifs: AviaNotification[]) => {
    setNotifications(notifs);
    prevUnreadRef.current = notifs.filter(n => n.isUnread).length;
  };

  const refreshChatUnread = useCallback(() => {
    fetchChatUnread(abortRef.current?.signal);
  }, [fetchChatUnread]);

  // Дней до истечения паспорта
  const passportDaysLeft = getDaysLeft(user?.passportExpiryDate);
  const unreadCount = notifications.filter(n => n.isUnread).length;

  return (
    <AviaContext.Provider
      value={{
        user,
        loading,
        isAuth: !!user?.phone,
        login,
        logout,
        refreshUser,
        updateUserLocal,
        notifications,
        unreadCount,
        refreshNotifications,
        updateNotifications,
        chatUnreadCount,
        refreshChatUnread,
        passportDaysLeft,
      }}
    >
      {children}
    </AviaContext.Provider>
  );
}

export function useAvia() {
  const ctx = useContext(AviaContext);
  if (!ctx) {
    return {
      user: null,
      loading: false,
      isAuth: false,
      login: () => {},
      logout: () => {},
      refreshUser: async () => {},
      updateUserLocal: () => {},
      notifications: [],
      unreadCount: 0,
      refreshNotifications: () => {},
      updateNotifications: () => {},
      chatUnreadCount: 0,
      refreshChatUnread: () => {},
      passportDaysLeft: null,
    } as AviaContextType;
  }
  return ctx;
}