/**
 * Чёрный список телефонов — общий для CARGO и AVIA.
 *
 * Когда админ удаляет водителя/курьера/отправителя, номер телефона
 * попадает сюда и блокируется от повторной регистрации/входа,
 * пока админ явно не снимет блокировку.
 *
 * KV: ovora:blacklist:phone:{cleanPhone} → BlacklistEntry
 */
import * as kv from "./kv_store.tsx";

export interface BlacklistEntry {
  phone        : string;
  reason       : string;
  blockedAt    : string;
  blockedBy    : string;
  source       : 'cargo' | 'avia';
  originalEmail?: string;
  originalRole ?: string;
  originalName ?: string;
}

const KEY = (phone: string) => `ovora:blacklist:phone:${phone}`;

export const Blacklist = {
  async add(phone: string, entry: Omit<BlacklistEntry, 'phone' | 'blockedAt'>): Promise<void> {
    const clean = (phone || '').replace(/\D/g, '');
    if (clean.length < 7) return;
    await kv.set(KEY(clean), { phone: clean, blockedAt: new Date().toISOString(), ...entry });
  },

  async check(phone: string): Promise<BlacklistEntry | null> {
    const clean = (phone || '').replace(/\D/g, '');
    if (clean.length < 7) return null;
    return (await kv.get(KEY(clean))) as BlacklistEntry | null;
  },

  async remove(phone: string): Promise<void> {
    const clean = (phone || '').replace(/\D/g, '');
    if (!clean) return;
    await kv.del(KEY(clean));
  },

  async listAll(): Promise<BlacklistEntry[]> {
    const all = await kv.getByPrefix('ovora:blacklist:phone:');
    return (all as BlacklistEntry[])
      .filter(e => e && e.phone)
      .sort((a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime());
  },
};
