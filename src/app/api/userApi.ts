import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a`;
const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${publicAnonKey}`,
};

export interface User {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName?: string;
  phone?: string;
  birthDate?: string;
  role?: 'sender' | 'driver';
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 👤 Получить данные пользователя из БД
 */
export async function getUser(email: string): Promise<User | null> {
  console.log('[userApi] Getting user from DB:', email);
  
  const res = await fetch(`${BASE}/users/${encodeURIComponent(email)}`, {
    headers: HEADERS,
  });

  if (!res.ok) {
    console.error('[userApi] Failed to get user:', res.status);
    return null;
  }

  const data = await res.json();
  if (data.error) {
    console.error('[userApi] Error getting user:', data.error);
    return null;
  }

  console.log('[userApi] User loaded from DB:', data.user);
  return data.user || null;
}

/**
 * ✏️ Обновить профиль пользователя в БД
 */
export async function updateUser(email: string, updates: Partial<User>): Promise<User | null> {
  console.log('[userApi] Updating user in DB:', email, updates);
  
  const res = await fetch(`${BASE}/users/${encodeURIComponent(email)}`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[userApi] Failed to update user:', err);
    throw new Error(`Ошибка обновления профиля: ${err}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  console.log('[userApi] User updated in DB:', data.user);
  return data.user;
}

/**
 * 📷 Загрузить фото профиля в Supabase Storage
 */
export async function uploadAvatar(email: string, file: File): Promise<string> {
  console.log('[userApi] Uploading avatar for:', email, 'file size:', file.size);

  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch(`${BASE}/users/${encodeURIComponent(email)}/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${publicAnonKey}` }, // Content-Type omitted — browser sets it with boundary
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[userApi] Failed to upload avatar:', err);
    throw new Error(`Ошибка загрузки фото: ${err}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  console.log('[userApi] Avatar uploaded, URL:', data.avatarUrl);
  return data.avatarUrl as string;
}

/**
 * 🔄 Синхронизировать ФИО пользователя во всех чатах
 * Вызывается после изменения профиля или успешной OCR верификации паспорта
 */
export async function syncUserNameInChats(
  email: string,
  userData: { firstName?: string; lastName?: string; middleName?: string; fullName?: string; avatarUrl?: string }
): Promise<void> {
  console.log('[userApi] Syncing user name in chats:', email, userData);
  try {
    const res = await fetch(`${BASE}/users/${encodeURIComponent(email)}/sync-chats`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      console.warn('[userApi] sync-chats returned:', res.status);
      return;
    }
    const data = await res.json();
    console.log('[userApi] sync-chats result:', data);
  } catch (err) {
    console.warn('[userApi] sync-chats error (non-critical):', err);
  }
}

/**
 * 🔄 Синхронизировать ФИО пользователя во всех поездках и предложениях
 * Вызывается после изменения профиля или успешной OCR верификации паспорта
 */
export async function syncUserNameInTrips(
  email: string,
  userData: { firstName?: string; lastName?: string; middleName?: string; fullName?: string; avatarUrl?: string }
): Promise<void> {
  console.log('[userApi] Syncing user name in trips:', email, userData);
  try {
    const res = await fetch(`${BASE}/users/${encodeURIComponent(email)}/sync-trips`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      console.warn('[userApi] sync-trips returned:', res.status);
      return;
    }
    const data = await res.json();
    console.log('[userApi] sync-trips result:', data);
  } catch (err) {
    console.warn('[userApi] sync-trips error (non-critical):', err);
  }
}