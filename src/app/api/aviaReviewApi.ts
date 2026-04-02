import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a`;
const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${publicAnonKey}`,
};

// ── Типы ─────────────────────────────────────────────────────────────────────

export type AviaReviewType = 'like' | 'dislike';

export interface AviaReview {
  id: string;
  dealId: string;
  authorPhone: string;
  authorName?: string;
  recipientPhone: string;
  type: AviaReviewType;
  comment: string;
  authorRole: 'courier' | 'sender';
  createdAt: string;
}

export interface AviaDealReviewedStatus {
  byInitiator?: boolean;
  byRecipient?: boolean;
}

export interface AviaPublicProfile {
  phone: string;
  firstName: string | null;
  lastName: string | null;
  role: 'courier' | 'sender' | 'both' | null;
  likes: number;
  dislikes: number;
  reviewsCount: number;
  dealsCompleted: number;
  createdAt: string | null;
}

// ── API функции ───────────────────────────────────────────────────────────────

/** Создать отзыв (like/dislike + обязательный комментарий) */
export async function createAviaReview(params: {
  dealId: string;
  authorPhone: string;
  type: AviaReviewType;
  comment: string;
}): Promise<{ success: boolean; review?: AviaReview; error?: string }> {
  try {
    const res = await fetch(`${BASE}/avia/reviews`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        ...params,
        authorPhone: params.authorPhone.replace(/\D/g, ''),
      }),
    });
    const data = await res.json();
    if (res.status === 409) return { success: false, error: data.error };
    if (!res.ok || data.error) return { success: false, error: data.error || 'Ошибка создания отзыва' };
    return { success: true, review: data.review };
  } catch (err: any) {
    console.error('[aviaReviewApi] createAviaReview error:', err);
    return { success: false, error: err.message || 'Ошибка сети' };
  }
}

/** Статус отзывов по сделке (кто уже оставил) */
export async function getAviaDealReviewStatus(dealId: string): Promise<AviaDealReviewedStatus> {
  try {
    const res = await fetch(`${BASE}/avia/reviews/deal/${encodeURIComponent(dealId)}`, {
      headers: HEADERS,
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.reviewed || {};
  } catch (err) {
    console.error('[aviaReviewApi] getAviaDealReviewStatus error:', err);
    return {};
  }
}

/** Все отзывы о пользователе */
export async function getAviaUserReviews(phone: string): Promise<AviaReview[]> {
  try {
    const clean = phone.replace(/\D/g, '');
    const res = await fetch(`${BASE}/avia/reviews/user/${encodeURIComponent(clean)}`, {
      headers: HEADERS,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.reviews || [];
  } catch (err) {
    console.error('[aviaReviewApi] getAviaUserReviews error:', err);
    return [];
  }
}

/** Публичный профиль пользователя */
export async function getAviaPublicProfile(phone: string): Promise<{
  profile: AviaPublicProfile;
  reviews: AviaReview[];
} | null> {
  try {
    const clean = phone.replace(/\D/g, '');
    const res = await fetch(`${BASE}/avia/profile/${encodeURIComponent(clean)}`, {
      headers: HEADERS,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[aviaReviewApi] getAviaPublicProfile error:', err);
    return null;
  }
}