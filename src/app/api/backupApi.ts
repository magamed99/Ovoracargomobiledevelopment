import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a`;
const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${publicAnonKey}`,
};

export interface BackupCodeResult {
  code: string;       // 64 hex chars — shown ONCE
  createdAt: string;
  algorithm: string;
  entropy: string;
}

export interface BackupExistsResult {
  exists: boolean;
  createdAt?: string;
  isUsed?: boolean;
  usedAt?: string | null;
  algorithm?: string;
}

/**
 * Generate a new 256-bit backup recovery code for the user.
 * Returns the raw 64-hex-char code exactly ONCE.
 * Store SHA-256 hash in KV — raw code is never persisted server-side.
 */
export async function generateBackupCode(email: string): Promise<BackupCodeResult> {
  const res = await fetch(`${BASE}/auth/backup/generate`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Backup generate error: ${err}`);
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Не удалось создать резервный код');
  return {
    code: data.code,
    createdAt: data.createdAt,
    algorithm: data.algorithm,
    entropy: data.entropy,
  };
}

/**
 * Verify a backup recovery code.
 * On success the code is marked as used (one-time).
 */
export async function verifyBackupCode(email: string, code: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/backup/verify`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Backup verify error: ${err}`);
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Неверный резервный код');
}

/**
 * Check if a backup code exists for the user (without revealing the hash).
 */
export async function checkBackupExists(email: string): Promise<BackupExistsResult> {
  const res = await fetch(
    `${BASE}/auth/backup/exists/${encodeURIComponent(email)}`,
    { headers: HEADERS }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Backup check error: ${err}`);
  }
  return res.json();
}
