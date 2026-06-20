import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a`;
const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${publicAnonKey}`,
};

// ── Типы ─────────────────────────────────────────────────────────────────────

export type AviaDealStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
export type AviaDealAdType = 'flight' | 'request';
export type AviaDealType = 'cargo' | 'docs';

export interface AviaDeal {
  id: string;
  // Участники
  initiatorPhone: string;
  initiatorName?: string;
  recipientPhone: string;
  recipientName?: string;
  // Объявление
  adType: AviaDealAdType;
  adId: string;
  adFrom: string;
  adTo: string;
  adDate?: string | null;
  // Тип сделки
  dealType?: AviaDealType;
  // Условия
  weightKg: number;
  price?: number | null;
  currency?: string;
  message?: string;
  // Роли (денормализованы)
  courierId: string;
  senderId: string;
  courierName?: string;
  senderName?: string;
  // Статус
  status: AviaDealStatus;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
  podPhotos?: AviaPODPhoto[];
}

export type AviaPODPhotoType = 'pickup' | 'delivery';

export interface AviaPODPhoto {
  type: AviaPODPhotoType;
  url: string;
  path: string;
  timestamp: string;
  uploadedBy: string;
}

export interface AviaStats {
  flightsTotal: number;
  flightsActive: number;
  chatsTotal: number;
  dealsTotal: number;
  dealsActive: number;
  dealsPending: number;
  dealsCompleted: number;
}

// ── API функции ───────────────────────────────────────────────────────────────

/** Создать предложение о сделке */
export async function createAviaDeal(params: {
  initiatorPhone: string;
  initiatorName?: string;
  recipientPhone: string;
  recipientName?: string;
  adType: AviaDealAdType;
  adId: string;
  adFrom: string;
  adTo: string;
  adDate?: string;
  weightKg: number;
  price?: number;
  currency?: string;
  message?: string;
  courierId: string;
  senderId: string;
  courierName?: string;
  senderName?: string;
  dealType?: AviaDealType;
}): Promise<{ success: boolean; deal?: AviaDeal; error?: string; dealId?: string }> {
  try {
    const res = await fetch(`${BASE}/avia/deals`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ ...params, callerPhone: params.initiatorPhone }),
    });
    const data = await res.json();
    if (res.status === 409) return { success: false, error: data.error, dealId: data.dealId };
    if (!res.ok || data.error) return { success: false, error: data.error || 'Ошибка создания сделки' };
    return { success: true, deal: data.deal };
  } catch (err: any) {
    return { success: false, error: err.message || 'Ошибка сети' };
  }
}

/** Получить сделку по id */
export async function getAviaDeal(dealId: string, callerPhone: string): Promise<AviaDeal | null> {
  try {
    const clean = callerPhone.replace(/\D/g, '');
    const res = await fetch(`${BASE}/avia/deals/${encodeURIComponent(dealId)}?callerPhone=${encodeURIComponent(clean)}`, {
      headers: HEADERS,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.deal || null;
  } catch {
    return null;
  }
}

/** Получить все сделки пользователя */
export async function getAviaDeals(phone: string): Promise<AviaDeal[]> {
  try {
    const clean = phone.replace(/\D/g, '');
    const res = await fetch(`${BASE}/avia/deals/user/${encodeURIComponent(clean)}?callerPhone=${encodeURIComponent(clean)}`, {
      headers: HEADERS,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.deals || [];
  } catch {
    return [];
  }
}

/** Принять сделку (получатель) */
export async function acceptAviaDeal(
  dealId: string,
  phone: string,
): Promise<{ success: boolean; deal?: AviaDeal; error?: string }> {
  try {
    const res = await fetch(`${BASE}/avia/deals/${encodeURIComponent(dealId)}/accept`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ phone: phone.replace(/\D/g, '') }),
    });
    const data = await res.json();
    if (!res.ok || data.error) return { success: false, error: data.error || 'Ошибка принятия' };
    return { success: true, deal: data.deal };
  } catch (err: any) {
    console.error('[aviaDealApi] acceptAviaDeal error:', err);
    return { success: false, error: err.message };
  }
}

/** Отклонить сделку (получатель) */
export async function rejectAviaDeal(
  dealId: string,
  phone: string,
  reason?: string,
): Promise<{ success: boolean; deal?: AviaDeal; error?: string }> {
  try {
    const res = await fetch(`${BASE}/avia/deals/${encodeURIComponent(dealId)}/reject`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ phone: phone.replace(/\D/g, ''), reason }),
    });
    const data = await res.json();
    if (!res.ok || data.error) return { success: false, error: data.error || 'Ошибка отклонения' };
    return { success: true, deal: data.deal };
  } catch (err: any) {
    console.error('[aviaDealApi] rejectAviaDeal error:', err);
    return { success: false, error: err.message };
  }
}

/** Отменить сделку (инициатор) */
export async function cancelAviaDeal(
  dealId: string,
  phone: string,
): Promise<{ success: boolean; deal?: AviaDeal; error?: string }> {
  try {
    const res = await fetch(`${BASE}/avia/deals/${encodeURIComponent(dealId)}/cancel`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ phone: phone.replace(/\D/g, '') }),
    });
    const data = await res.json();
    if (!res.ok || data.error) return { success: false, error: data.error || 'Ошибка отмены' };
    return { success: true, deal: data.deal };
  } catch (err: any) {
    console.error('[aviaDealApi] cancelAviaDeal error:', err);
    return { success: false, error: err.message };
  }
}

/** Завершить сделку (любой участник) */
export async function completeAviaDeal(
  dealId: string,
  phone: string,
): Promise<{ success: boolean; deal?: AviaDeal; error?: string }> {
  try {
    const res = await fetch(`${BASE}/avia/deals/${encodeURIComponent(dealId)}/complete`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ phone: phone.replace(/\D/g, '') }),
    });
    const data = await res.json();
    if (!res.ok || data.error) return { success: false, error: data.error || 'Ошибка завершения' };
    return { success: true, deal: data.deal };
  } catch (err: any) {
    console.error('[aviaDealApi] completeAviaDeal error:', err);
    return { success: false, error: err.message };
  }
}

/** Загрузить фото получения/передачи товара (только курьер, только пока сделка активна) */
export async function uploadAviaDealPOD(
  dealId: string,
  type: AviaPODPhotoType,
  base64: string,
  callerPhone: string,
): Promise<{ success: boolean; photo?: AviaPODPhoto; error?: string }> {
  try {
    const res = await fetch(`${BASE}/avia/deals/${encodeURIComponent(dealId)}/pod`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ base64, type, callerPhone: callerPhone.replace(/\D/g, '') }),
    });
    const data = await res.json();
    if (!res.ok || data.error) return { success: false, error: data.error || 'Ошибка загрузки фото' };
    return { success: true, photo: data.photo };
  } catch (err: any) {
    console.error('[aviaDealApi] uploadAviaDealPOD error:', err);
    return { success: false, error: err.message };
  }
}

/** Получить статистику профиля */
export async function getAviaStats(phone: string): Promise<AviaStats | null> {
  try {
    const clean = phone.replace(/\D/g, '');
    const res = await fetch(`${BASE}/avia/stats/${encodeURIComponent(clean)}`, {
      headers: HEADERS,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stats || null;
  } catch {
    return null;
  }
}
