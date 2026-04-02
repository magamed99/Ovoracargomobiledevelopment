import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a`;
const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${publicAnonKey}`,
};

export interface Document {
  id: string;
  userEmail: string;
  type: string;
  title: string;
  subtitle: string;
  status: 'verified' | 'rejected' | 'not_uploaded'; // ✅ Убрал 'pending' - только автоматическая верификация
  photoUrl?: string;
  photoPath?: string;
  uploadDate?: string;
  expiryDate?: string;
  photoQualityScore: number;
  rejectionReason?: string; // ✅ Автоматическая причина отказа
  extractedFullName?: string; // ✅ ФИО извлеченное из документа
  extractedData?: any; // ✅ Все извлеченные данные (дата рождения, номер и т.д.)
  createdAt: string;
  updatedAt: string;
  // ✅ Поля для обновления профиля
  profileUpdated?: boolean; // Флаг что профиль был обновлён
  updatedUser?: any; // Обновлённые данные пользователя
}

/**
 * 📤 Upload document with file
 */
export async function uploadDocument(params: {
  file: File;
  userEmail: string;
  documentId: string;
  documentType: string;
  title: string;
  subtitle: string;
  expiryDate?: string;
  extractedFullName?: string; // ✅ ФИО пользователя (для проверки соответствия)
}): Promise<Document> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('userEmail', params.userEmail);
  formData.append('documentId', params.documentId);
  formData.append('documentType', params.documentType);
  formData.append('title', params.title);
  formData.append('subtitle', params.subtitle);
  if (params.expiryDate) {
    formData.append('expiryDate', params.expiryDate);
  }
  if (params.extractedFullName) {
    formData.append('extractedFullName', params.extractedFullName);
  }

  const res = await fetch(`${BASE}/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[documentsApi] Upload error:', err);
    throw new Error(`Ошибка загрузки документа: ${err}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  console.log('[documentsApi] Document uploaded:', data.document);
  console.log('[documentsApi] Profile updated:', data.profileUpdated);
  
  // ✅ Возвращаем весь объект, включая updatedUser и profileUpdated
  return {
    ...data.document,
    profileUpdated: data.profileUpdated,
    updatedUser: data.updatedUser,
  };
}

/**
 * 📋 Get all documents for a user (with retry on network failure)
 */
export async function getUserDocuments(userEmail: string): Promise<Document[]> {
  const MAX_ATTEMPTS = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(`${BASE}/documents/user/${encodeURIComponent(userEmail)}`, {
        headers: HEADERS,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.text();
        console.error(`[documentsApi] Fetch error (attempt ${attempt}):`, err);
        throw new Error(`Ошибка загрузки документов: ${err}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      console.log('[documentsApi] Loaded documents:', data.documents?.length || 0);
      return data.documents || [];
    } catch (err: any) {
      lastError = err;
      const isNetworkError = err?.name === 'TypeError' || err?.name === 'AbortError';
      if (isNetworkError && attempt < MAX_ATTEMPTS) {
        const delay = attempt * 1000; // 1s, 2s
        console.warn(`[documentsApi] Network error on attempt ${attempt}, retrying in ${delay}ms...`, err?.message);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * ✏️ Update document
 */
export async function updateDocument(
  documentId: string,
  userEmail: string,
  updates: Partial<Document>
): Promise<Document> {
  const res = await fetch(`${BASE}/documents/${documentId}`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ userEmail, ...updates }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[documentsApi] Update error:', err);
    throw new Error(`Ошибка обновления документа: ${err}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  console.log('[documentsApi] Document updated:', data.document);
  return data.document;
}

/**
 * 🗑️ Delete document
 */
export async function deleteDocument(documentId: string, userEmail: string): Promise<void> {
  const res = await fetch(`${BASE}/documents/${documentId}`, {
    method: 'DELETE',
    headers: HEADERS,
    body: JSON.stringify({ userEmail }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[documentsApi] Delete error:', err);
    throw new Error(`Ошибка удаления документа: ${err}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  console.log('[documentsApi] Document deleted:', documentId);
}

/**
 * 🔍 Re-analyze document
 */
export async function analyzeDocument(documentId: string, userEmail: string): Promise<number> {
  const res = await fetch(`${BASE}/documents/analyze/${documentId}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ userEmail }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[documentsApi] Analyze error:', err);
    throw new Error(`Ошибка анализа документа: ${err}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  console.log('[documentsApi] Document analyzed:', data.photoQualityScore);
  return data.photoQualityScore;
}