/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  AVIA ROUTES — HTTP Transport Layer                         ║
 * ║                                                              ║
 * ║  Маршруты используют:                                       ║
 * ║    aviaRepo  — data access (KV сейчас, SQL при миграции)    ║
 * ║    aviaCache — кеш (in-memory сейчас, Redis при миграции)   ║
 * ║    aviaRL    — rate limiting (in-memory → Redis)            ║
 * ║                                                              ║
 * ║  При миграции на SQL/Redis ЭТОТ ФАЙЛ НЕ МЕНЯЕТСЯ.          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { Hono } from "npm:hono";
import * as bcrypt from "npm:bcryptjs";
import {
  Users, Pins, Flights, Requests, Notifs, Deals, Chats, Reviews,
  aviaClean, aviaChatId, aviaId,
  type AviaUser, type AviaFlight, type AviaRequest, type AviaDeal,
  type AviaChatMeta, type AviaMessage, type AviaNotif, type AviaReview,
} from "./aviaRepo.tsx";
import { aviaRL, RL, rateLimitMiddleware } from "./rateLimit.tsx";
import { aviaCache, CK, TTL } from "./cache.tsx";
import { sendEmail, throttleEmail } from "./email.tsx";

// ── Константы ────────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS          = 10;
const MAX_LOGIN_ATTEMPTS     = 10;
const PIN_CHANGE_MAX_ATTEMPTS = 3;
const PIN_CHANGE_LOCKOUT_MS  = 5 * 60_000; // 5 мин

// ── Зависимости (инъекция при init) — MIGRATION POINT ────────────────────────
interface AviaDeps {
  supabase           : any;
  AVIA_PASSPORT_BUCKET: string;
  AVATAR_BUCKET      : string;
  extractDocumentData: (base64: string, type: string) => Promise<any>;
  sendPushToUser     : (email: string, payload: any) => Promise<void>;
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN SETUP
// ══════════════════════════════════════════════════════════════════════════════

export function setupAviaRoutes(app: Hono, deps: AviaDeps): void {
  const { supabase, AVIA_PASSPORT_BUCKET, AVATAR_BUCKET, extractDocumentData, sendPushToUser } = deps;

  const P = '/make-server-4e36197a/avia'; // prefix

  // ── Rate limit middleware factory (shorthand) ──────────────────────────────
  const rlPhone = (preset: { max: number; windowMs: number }) =>
    rateLimitMiddleware(preset, (c) => {
      try { return aviaClean(c.req.query('phone') || ''); } catch { return 'anon'; }
    });

  const rlIp = (preset: { max: number; windowMs: number }) =>
    rateLimitMiddleware(preset, (c) =>
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    );

  // ══════════════════════════════════════════════════════════════════════════
  //  AUTH — check-phone / register / login / pin-change
  // ══════════════════════════════════════════════════════════════════════════

  app.post(`${P}/check-phone`, rlIp(RL.CHECK_PHONE), async (c) => {
    try {
      const { phone } = await c.req.json();
      if (!phone) return c.json({ error: 'phone required' }, 400);
      const clean = aviaClean(phone);
      if (clean.length < 9) return c.json({ error: 'Некорректный номер телефона' }, 400);

      const [pinData, user] = await Promise.all([
        Pins.get(clean),
        Users.get(clean),
      ]);

      if (pinData?.pinHash) {
        return c.json({ success: true, isNew: false, hasPin: true, hasProfile: !!user?.firstName });
      }
      return c.json({ success: true, isNew: true, hasPin: false });
    } catch (err) {
      console.log('Error POST /avia/check-phone:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.post(`${P}/register`, rlIp(RL.REGISTER), async (c) => {
    try {
      const { phone, pin, role } = await c.req.json();
      if (!phone || !pin || !role) return c.json({ error: 'phone, pin, role required' }, 400);

      const clean = aviaClean(phone);
      if (clean.length < 9) return c.json({ error: 'Некорректный номер телефона' }, 400);
      if (!/^\d{4}$/.test(pin)) return c.json({ error: 'PIN должен содержать 4 цифры' }, 400);
      if (!['courier', 'sender', 'both'].includes(role)) return c.json({ error: 'role must be courier/sender/both' }, 400);

      const existingPin = await Pins.get(clean);
      if (existingPin?.pinHash) return c.json({ error: 'Этот номер уже зарегистрирован. Используйте вход.' }, 409);

      const salt    = await bcrypt.genSalt(BCRYPT_ROUNDS);
      const pinHash = await bcrypt.hash(pin, salt);
      const now     = new Date().toISOString();
      const id      = aviaId('avia');

      await Pins.set(clean, { pinHash, phone: clean, createdAt: now, attempts: 0 });

      const user: AviaUser = {
        id, phone: clean, role: role as any,
        firstName: '', lastName: '', middleName: '',
        birthDate: '', passportNumber: '',
        passportPhoto: '', passportPhotoPath: '',
        avatarUrl: '', createdAt: now, lastLoginAt: now,
      };
      await Users.set(clean, user);

      console.log(`[AVIA] Registered: ${clean}, role=${role}`);
      return c.json({ success: true, user });
    } catch (err) {
      console.log('Error POST /avia/register:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.post(`${P}/login`, rlIp(RL.LOGIN), async (c) => {
    try {
      const { phone, pin } = await c.req.json();
      if (!phone || !pin) return c.json({ error: 'phone and pin required' }, 400);

      const clean   = aviaClean(phone);
      const pinData = await Pins.get(clean);

      if (!pinData?.pinHash) return c.json({ error: 'Аккаунт не найден. Зарегистрируйтесь.' }, 404);

      const attempts = (pinData.attempts || 0) + 1;
      if (attempts > MAX_LOGIN_ATTEMPTS) return c.json({ error: 'Превышен лимит попыток. Обратитесь в поддержку.' }, 429);

      const isCorrect = await bcrypt.compare(pin, pinData.pinHash);
      if (!isCorrect) {
        await Pins.set(clean, { ...pinData, attempts });
        const left = MAX_LOGIN_ATTEMPTS - attempts;
        return c.json({
          error: left > 0 ? `Неверный PIN. Осталось попыток: ${left}` : 'Превышен лимит попыток.',
          attemptsLeft: left,
        }, 401);
      }

      // Сброс попыток + обновление lastLoginAt
      await Pins.set(clean, { ...pinData, attempts: 0 });
      const user = await Users.update(clean, { lastLoginAt: new Date().toISOString() });

      console.log(`[AVIA] Login success: ${clean}`);
      return c.json({ success: true, user: user || { phone: clean } });
    } catch (err) {
      console.log('Error POST /avia/login:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.patch(`${P}/users/:phone/pin`, rlPhone(RL.PIN_CHANGE), async (c) => {
    try {
      const phone      = aviaClean(decodeURIComponent(c.req.param('phone')));
      const { currentPin, newPin } = await c.req.json();

      if (!currentPin || !newPin) return c.json({ error: 'currentPin and newPin required' }, 400);
      if (!/^\d{4}$/.test(newPin)) return c.json({ error: 'Новый PIN должен содержать 4 цифры' }, 400);

      const pinData = await Pins.get(phone);
      if (!pinData?.pinHash) return c.json({ error: 'Аккаунт не найден' }, 404);

      // Lockout
      const changeMeta = await Pins.getPinChange(phone) || { attempts: 0, lockedUntil: null, lastAttempt: new Date().toISOString() };
      if (changeMeta.lockedUntil) {
        const lockEnd = new Date(changeMeta.lockedUntil).getTime();
        if (Date.now() < lockEnd) {
          const leftSec = Math.ceil((lockEnd - Date.now()) / 1000);
          return c.json({ error: `Слишком много попыток. Повторите через ${leftSec} сек.`, lockedUntil: changeMeta.lockedUntil, lockedSeconds: leftSec }, 429);
        }
        changeMeta.attempts   = 0;
        changeMeta.lockedUntil = null;
      }

      const isCorrect = await bcrypt.compare(currentPin, pinData.pinHash);
      if (!isCorrect) {
        const newAttempts = (changeMeta.attempts || 0) + 1;
        const lockout     = newAttempts >= PIN_CHANGE_MAX_ATTEMPTS;
        const meta        = {
          attempts    : newAttempts,
          lockedUntil : lockout ? new Date(Date.now() + PIN_CHANGE_LOCKOUT_MS).toISOString() : null,
          lastAttempt : new Date().toISOString(),
        };
        await Pins.setPinChange(phone, meta);
        const left = PIN_CHANGE_MAX_ATTEMPTS - newAttempts;
        if (lockout) return c.json({ error: 'Превышен лимит попыток. Повторите через 5 минут.', lockedUntil: meta.lockedUntil, lockedSeconds: Math.ceil(PIN_CHANGE_LOCKOUT_MS / 1000) }, 429);
        return c.json({ error: `Неверный текущий PIN. Осталось попыток: ${left}`, attemptsLeft: left }, 401);
      }

      const salt    = await bcrypt.genSalt(BCRYPT_ROUNDS);
      const newHash = await bcrypt.hash(newPin, salt);
      await Pins.set(phone, { ...pinData, pinHash: newHash, updatedAt: new Date().toISOString(), attempts: 0 });
      await Pins.delPinChange(phone);
      aviaRL.reset(`avia-pin-change:${phone}`);

      console.log(`[AVIA] PIN changed for: ${phone}`);
      return c.json({ success: true });
    } catch (err) {
      console.log('Error PATCH /avia/users/:phone/pin:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  PROFILE
  // ══════════════════════════════════════════════════════════════════════════

  app.get(`${P}/profile/:phone`, async (c) => {
    try {
      const phone = aviaClean(decodeURIComponent(c.req.param('phone')));
      const user  = await Users.get(phone);
      if (!user) return c.json({ found: false });
      return c.json({ found: true, user });
    } catch (err) {
      console.log('Error GET /avia/profile:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.put(`${P}/profile`, async (c) => {
    try {
      const body  = await c.req.json();
      const { phone, ...updates } = body;
      if (!phone) return c.json({ error: 'phone required' }, 400);

      const clean = aviaClean(phone);

      if (updates.role && !['courier', 'sender', 'both'].includes(updates.role)) return c.json({ error: 'role must be courier/sender/both' }, 400);

      // 🔒 Паспорт нельзя менять через PUT
      delete updates.passportPhoto;
      delete updates.passportPhotoPath;
      delete updates.passportUploadedAt;
      delete updates.passportExpiryDate;
      delete updates.passportVerified;

      const updated = await Users.update(clean, updates);
      if (!updated) return c.json({ error: 'User not found' }, 404);

      console.log(`[AVIA] Profile updated: ${clean}`);
      return c.json({ success: true, user: updated });
    } catch (err) {
      console.log('Error PUT /avia/profile:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  AVATAR UPLOAD
  // ══════════════════════════════════════════════════════════════════════════

  app.post(`${P}/users/:phone/avatar`, rlPhone(RL.UPLOAD), async (c) => {
    try {
      const phone = aviaClean(decodeURIComponent(c.req.param('phone')));
      if (!phone) return c.json({ error: 'phone required' }, 400);

      const form = await c.req.formData();
      const file = form.get('avatar') as File | null;
      if (!file || !file.size) return c.json({ error: 'No avatar file provided' }, 400);

      const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `avia/${phone}/${Date.now()}.${ext}`;
      const buf  = new Uint8Array(await file.arrayBuffer());

      const { error: uploadErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, buf, { contentType: file.type || 'image/jpeg', upsert: true });
      if (uploadErr) return c.json({ error: `Storage error: ${uploadErr.message}` }, 500);

      const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      const avatarUrl = urlData.publicUrl;

      const existing = await Users.get(phone);
      if (!existing) return c.json({ error: 'AVIA user not found' }, 404);

      const updated = await Users.update(phone, { avatarUrl });
      return c.json({ success: true, avatarUrl, user: updated });
    } catch (err) {
      console.log('Error POST /avia/users/:phone/avatar:', err);
      return c.json({ error: `Avatar upload failed: ${err}` }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  PASSPORT
  // ══════════════════════════════════════════════════════════════════════════

  app.post(`${P}/upload-passport`, rlPhone(RL.UPLOAD), async (c) => {
    try {
      const formData        = await c.req.formData();
      const phone           = formData.get('phone') as string;
      const file            = formData.get('file') as File;
      const expiryDateManual = formData.get('expiryDate') as string | null;
      const skipOcr         = formData.get('skipOcr') === 'true';

      if (!phone || !file) return c.json({ error: 'phone and file required' }, 400);
      const clean    = aviaClean(phone);
      const existing = await Users.get(clean);
      if (!existing) return c.json({ error: 'User not found' }, 404);

      // 🔒 Уже загружен
      if (existing.passportPhoto || existing.passportPhotoPath) {
        return c.json({ error: 'Паспорт уже загружен. Изменить фото нельзя.' }, 409);
      }
      if (file.size > 10 * 1024 * 1024) return c.json({ error: 'Файл слишком большой (макс 10 МБ)' }, 413);

      const ext         = file.name?.split('.').pop() || 'jpg';
      const storagePath = `avia-passports/${clean}/${Date.now()}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadErr } = await supabase.storage
        .from(AVIA_PASSPORT_BUCKET)
        .upload(storagePath, arrayBuffer, { contentType: file.type || 'image/jpeg', upsert: false });
      if (uploadErr) return c.json({ error: `Ошибка загрузки: ${uploadErr.message}` }, 500);

      const { data: signedData } = await supabase.storage
        .from(AVIA_PASSPORT_BUCKET)
        .createSignedUrl(storagePath, 3600 * 24 * 365);
      const photoUrl = signedData?.signedUrl || '';

      let ocrExpiryDate: string | null = null;
      let ocrFullName: string | null   = null;
      const profileUpdates: Partial<AviaUser> = {};

      if (!skipOcr) {
        try {
          const uint8 = new Uint8Array(arrayBuffer);
          let bin = '';
          for (let i = 0; i < uint8.length; i++) bin += String.fromCharCode(uint8[i]);
          const base64Image = btoa(bin);
          const ocrResult   = await extractDocumentData(base64Image, 'passport');
          console.log('[AVIA] OCR result:', JSON.stringify(ocrResult));

          ocrExpiryDate = ocrResult.expiryDate || null;
          ocrFullName   = ocrResult.fullName || null;

          if (ocrFullName && !existing.firstName) {
            const parts = ocrFullName.trim().split(/\s+/);
            if (parts.length >= 2) {
              profileUpdates.lastName  = parts[0];
              profileUpdates.firstName = parts[1];
              if (parts.length >= 3) profileUpdates.middleName = parts.slice(2).join(' ');
            }
          }
          if (ocrResult.birthDate && !existing.birthDate) {
            const bparts = ocrResult.birthDate.split(/[.\/-]/);
            if (bparts.length === 3 && bparts[2]?.length === 4) {
              profileUpdates.birthDate = `${bparts[2]}-${bparts[1].padStart(2,'0')}-${bparts[0].padStart(2,'0')}`;
            }
          }
          if (ocrResult.documentNumber && !existing.passportNumber) {
            profileUpdates.passportNumber = ocrResult.documentNumber;
          }
        } catch (ocrErr) { console.warn('[AVIA] OCR failed (non-critical):', ocrErr); }
      }

      const finalExpiry = ocrExpiryDate || expiryDateManual || '';
      const isExpired   = finalExpiry ? new Date(finalExpiry).getTime() < Date.now() : false;
      const now         = new Date().toISOString();

      const updated = await Users.update(clean, {
        ...profileUpdates,
        passportPhoto       : photoUrl,
        passportPhotoPath   : storagePath,
        passportUploadedAt  : now,
        passportExpiryDate  : finalExpiry,
        passportVerified    : true,
        passportExpired     : isExpired,
      });

      console.log(`[AVIA] Passport uploaded for ${clean}: expired=${isExpired}`);
      return c.json({ success: true, user: updated, photoUrl, expiryDate: finalExpiry, isExpired, ocrFullName });
    } catch (err) {
      console.log('[AVIA] Upload passport error:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.get(`${P}/passport-photo/:phone`, async (c) => {
    try {
      const phone = aviaClean(decodeURIComponent(c.req.param('phone')));
      const user  = await Users.get(phone);
      if (!user?.passportPhotoPath) return c.json({ found: false });

      const { data } = await supabase.storage
        .from(AVIA_PASSPORT_BUCKET)
        .createSignedUrl(user.passportPhotoPath, 3600);
      return c.json({ found: true, photoUrl: data?.signedUrl || '' });
    } catch (err) {
      console.log('[AVIA] Get passport photo error:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.post(`${P}/scan-passport`, rlIp(RL.UPLOAD), async (c) => {
    try {
      const { imageBase64 } = await c.req.json();
      if (!imageBase64) return c.json({ error: 'imageBase64 required' }, 400);

      const result = await extractDocumentData(imageBase64, 'passport');

      let birthDateISO: string | null = null;
      if (result.birthDate) {
        const parts = result.birthDate.split(/[.\/-]/);
        if (parts.length === 3) {
          const [dd, mm, yyyy] = parts;
          if (yyyy?.length === 4) birthDateISO = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
        }
      }

      return c.json({ success: true, fullName: result.fullName || null, birthDate: birthDateISO, documentNumber: result.documentNumber || null });
    } catch (err) {
      console.log('[AVIA] OCR scan error:', err);
      return c.json({ error: `OCR scan failed: ${err}`, success: false }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  FLIGHTS
  // ══════════════════════════════════════════════════════════════════════════

  app.get(`${P}/flights`, async (c) => {
    try {
      const qFrom      = (c.req.query('from') || '').trim().toLowerCase();
      const qTo        = (c.req.query('to')   || '').trim().toLowerCase();
      const qDate      = (c.req.query('date') || '').trim();
      const qWeightMin = Number(c.req.query('weightMin')) || 0;
      const qWeightMax = Number(c.req.query('weightMax')) || 0;

      let flights = await Flights.listActive();

      if (qFrom || qTo || qDate || qWeightMin || qWeightMax) {
        flights = flights.filter(f => {
          if (qFrom && !(f.from || '').toLowerCase().includes(qFrom)) return false;
          if (qTo   && !(f.to   || '').toLowerCase().includes(qTo))   return false;
          if (qDate && f.date !== qDate) return false;
          if (qWeightMin > 0 && (f.freeKg || 0) < qWeightMin) return false;
          if (qWeightMax > 0 && (f.freeKg || 0) > qWeightMax) return false;
          return true;
        });
      }

      return c.json({ flights });
    } catch (err) {
      console.log('Error GET /avia/flights:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.post(`${P}/flights`, rlPhone(RL.GENERAL_WRITE), async (c) => {
    try {
      const body = await c.req.json();
      const { courierId, from, to, date, flightNo, cargoEnabled, cargoKg, pricePerKg, docsEnabled, docsPrice, freeKg, currency } = body;

      if (!courierId || !from || !to || !date) return c.json({ error: 'Missing required fields: courierId, from, to, date' }, 400);

      const isCargoEnabled = cargoEnabled ?? (freeKg != null && Number(freeKg) > 0);
      const isDocsEnabled  = docsEnabled  ?? false;
      if (!isCargoEnabled && !isDocsEnabled) return c.json({ error: 'Выберите хотя бы один тип: Груз или Документы' }, 400);

      const actualCargoKg = isCargoEnabled ? (Number(cargoKg || freeKg) || 0) : 0;
      if (isCargoEnabled && actualCargoKg <= 0) return c.json({ error: 'Укажите количество кг для груза' }, 400);

      const user = await Users.get(courierId);
      if (!user) return c.json({ error: 'User not found' }, 404);
      if (!user.passportPhoto && !user.passportPhotoPath) return c.json({ error: 'Необходимо загрузить фото паспорта' }, 403);
      if (!user.firstName || !user.lastName) return c.json({ error: 'Необходимо заполнить ФИО в профиле' }, 403);
      if (user.passportExpired) return c.json({ error: 'Срок действия вашего паспорта истёк' }, 403);

      const id: string = aviaId('avia_flight');
      const flight: AviaFlight = {
        id, courierId,
        courierName  : `${user.firstName} ${user.lastName}`.trim() || user.phone,
        courierAvatar: user.avatarUrl || '',
        from, to, date,
        flightNo     : flightNo || '',
        cargoEnabled : isCargoEnabled,
        cargoKg      : actualCargoKg,
        freeKg       : actualCargoKg,
        reservedKg   : 0,
        pricePerKg   : Number(pricePerKg) || 0,
        docsEnabled  : isDocsEnabled,
        docsPrice    : isDocsEnabled ? (Number(docsPrice) || 0) : 0,
        currency     : (currency && typeof currency === 'string') ? currency.toUpperCase() : 'USD',
        status       : 'active',
        createdAt    : new Date().toISOString(),
      };

      await Flights.set(id, flight);
      console.log(`[AVIA] Flight created ${id}`);
      return c.json({ success: true, flight });
    } catch (err) {
      console.log('Error POST /avia/flights:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.delete(`${P}/flights/:id`, async (c) => {
    try {
      const id     = c.req.param('id');
      const flight = await Flights.get(id);
      if (!flight) return c.json({ error: 'Flight not found' }, 404);
      await Flights.set(id, { ...flight, isDeleted: true, updatedAt: new Date().toISOString() });
      return c.json({ success: true });
    } catch (err) {
      console.log('Error DELETE /avia/flights:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.patch(`${P}/flights/:id/close`, async (c) => {
    try {
      const id     = c.req.param('id');
      const flight = await Flights.get(id);
      if (!flight) return c.json({ error: 'Flight not found' }, 404);
      if (flight.isDeleted)       return c.json({ error: 'Flight already deleted' }, 400);
      if (flight.status === 'closed') return c.json({ error: 'Flight already closed' }, 400);
      const now     = new Date().toISOString();
      const updated = { ...flight, status: 'closed', closedAt: now, updatedAt: now };
      await Flights.set(id, updated);
      return c.json({ success: true, flight: updated });
    } catch (err) {
      console.log('Error PATCH /avia/flights/close:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.patch(`${P}/flights/:id/complete`, async (c) => {
    try {
      const id     = c.req.param('id');
      const flight = await Flights.get(id);
      if (!flight) return c.json({ error: 'Flight not found' }, 404);
      if (flight.isDeleted)           return c.json({ error: 'Flight deleted' }, 400);
      if (flight.status === 'completed') return c.json({ error: 'Flight already completed' }, 400);

      const now     = new Date().toISOString();
      const updated = { ...flight, status: 'completed', completedAt: now, updatedAt: now, freeKg: 0, reservedKg: 0 };
      await Flights.set(id, updated);

      // Завершаем все принятые сделки по этому рейсу (fire-and-forget)
      // MIGRATION POINT: вынести в очередь (BullMQ / pg-boss)
      ;(async () => {
        try {
          const userDeals = await Deals.listByUser(flight.courierId);
          let count = 0;
          for (const deal of userDeals) {
            if (deal.adId !== id || deal.status !== 'accepted') continue;
            await Deals.set(deal.id, { ...deal, status: 'completed', completedAt: now, updatedAt: now });
            count++;

            // Системное сообщение в чат
            const chatId = aviaChatId(deal.initiatorPhone, deal.recipientPhone);
            const meta   = await Chats.getMeta(chatId);
            if (meta) {
              const msgId = aviaId('deal_update');
              await Chats.addMessage(chatId, { id: msgId, chatId, senderPhone: 'system', text: 'Поездка завершена', type: 'deal_update', meta: { dealId: deal.id, status: 'completed' }, createdAt: now });
              await Chats.setMeta(chatId, { ...meta, lastMessage: '✈ Поездка завершена', lastMessageAt: now, lastSenderPhone: 'system' });
            }

            // Уведомление отправителю
            const notifId = aviaId('flight_done');
            await Notifs.push(deal.senderId, {
              id: notifId, phone: deal.senderId, type: 'system',
              iconName: 'Star', iconBg: 'bg-yellow-500/10 text-yellow-400',
              title: '✈ Поездка завершена!',
              description: `Курьер ${flight.courierName || flight.courierId} завершил поездку · ${flight.from} → ${flight.to}`,
              isUnread: true, createdAt: now, meta: { dealId: deal.id, flightId: id },
            });
          }
          console.log(`[AVIA] Flight ${id} completed. ${count} deals completed`);
        } catch (e) { console.warn('[AVIA] Complete flight side-effects error:', e); }
      })();

      return c.json({ success: true, flight: updated });
    } catch (err) {
      console.log('Error PATCH /avia/flights/complete:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  REQUESTS
  // ══════════════════════════════════════════════════════════════════════════

  app.get(`${P}/requests`, async (c) => {
    try {
      const qFrom      = (c.req.query('from') || '').trim().toLowerCase();
      const qTo        = (c.req.query('to')   || '').trim().toLowerCase();
      const qDate      = (c.req.query('date') || '').trim();
      const qWeightMin = Number(c.req.query('weightMin')) || 0;
      const qWeightMax = Number(c.req.query('weightMax')) || 0;

      let requests = await Requests.listActive();

      if (qFrom || qTo || qDate || qWeightMin || qWeightMax) {
        requests = requests.filter(r => {
          if (qFrom && !(r.from || '').toLowerCase().includes(qFrom)) return false;
          if (qTo   && !(r.to   || '').toLowerCase().includes(qTo))   return false;
          if (qDate && r.beforeDate !== qDate) return false;
          if (qWeightMin > 0 && (r.weightKg || 0) < qWeightMin) return false;
          if (qWeightMax > 0 && (r.weightKg || 0) > qWeightMax) return false;
          return true;
        });
      }

      return c.json({ requests });
    } catch (err) {
      console.log('Error GET /avia/requests:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.post(`${P}/requests`, rlPhone(RL.GENERAL_WRITE), async (c) => {
    try {
      const body = await c.req.json();
      const { senderId, from, to, beforeDate, weightKg, description, budget, currency } = body;

      if (!senderId || !from || !to || !beforeDate || !weightKg) return c.json({ error: 'Missing required fields' }, 400);

      const user = await Users.get(senderId);
      if (!user) return c.json({ error: 'User not found' }, 404);
      if (!user.passportPhoto && !user.passportPhotoPath) return c.json({ error: 'Необходимо загрузить фото паспорта' }, 403);
      if (!user.firstName || !user.lastName) return c.json({ error: 'Необходимо заполнить ФИО в профиле' }, 403);
      if (user.passportExpired) return c.json({ error: 'Срок действия вашего паспорта истёк' }, 403);

      const id: string = aviaId('avia_req');
      const request: AviaRequest = {
        id, senderId,
        senderName  : `${user.firstName} ${user.lastName}`.trim() || user.phone,
        senderAvatar: user.avatarUrl || '',
        from, to, beforeDate,
        weightKg    : Number(weightKg),
        description : description || '',
        budget      : budget != null ? (Number(budget) || 0) : null,
        currency    : (currency && typeof currency === 'string') ? currency.toUpperCase() : 'USD',
        status      : 'active',
        createdAt   : new Date().toISOString(),
      };

      await Requests.set(id, request);
      return c.json({ success: true, request });
    } catch (err) {
      console.log('Error POST /avia/requests:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.delete(`${P}/requests/:id`, async (c) => {
    try {
      const id  = c.req.param('id');
      const req = await Requests.get(id);
      if (!req) return c.json({ error: 'Request not found' }, 404);
      await Requests.set(id, { ...req, isDeleted: true, updatedAt: new Date().toISOString() });
      return c.json({ success: true });
    } catch (err) {
      console.log('Error DELETE /avia/requests:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.patch(`${P}/requests/:id/close`, async (c) => {
    try {
      const id  = c.req.param('id');
      const req = await Requests.get(id);
      if (!req) return c.json({ error: 'Request not found' }, 404);
      if (req.isDeleted)         return c.json({ error: 'Request already deleted' }, 400);
      if (req.status === 'closed') return c.json({ error: 'Request already closed' }, 400);
      const now     = new Date().toISOString();
      const updated = { ...req, status: 'closed', closedAt: now, updatedAt: now };
      await Requests.set(id, updated);
      return c.json({ success: true, request: updated });
    } catch (err) {
      console.log('Error PATCH /avia/requests/close:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  MY ADS
  // ══════════════════════════════════════════════════════════════════════════

  app.get(`${P}/my/:phone`, async (c) => {
    try {
      const phone = aviaClean(c.req.param('phone'));
      const [flights, requests] = await Promise.all([
        Flights.listByCourier(phone),
        Requests.listBySender(phone),
      ]);
      return c.json({ flights, requests });
    } catch (err) {
      console.log('Error GET /avia/my:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════════

  app.get(`${P}/notifications/check/:phone`, async (c) => {
    try {
      const phone  = aviaClean(decodeURIComponent(c.req.param('phone')));
      if (!phone) return c.json({ unread: 0 });
      const unread = await Notifs.countUnread(phone);
      return c.json({ unread });
    } catch (err) {
      console.log('Error GET /avia/notifications/check:', err);
      return c.json({ unread: 0 });
    }
  });

  app.get(`${P}/notifications/:phone`, async (c) => {
    try {
      const phone = aviaClean(decodeURIComponent(c.req.param('phone')));
      if (!phone) return c.json({ error: 'phone required' }, 400);
      const notifications = await Notifs.list(phone);
      return c.json({ notifications });
    } catch (err) {
      console.log('Error GET /avia/notifications/:phone:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.post(`${P}/notifications/read`, async (c) => {
    try {
      const { phone, id } = await c.req.json();
      if (!phone) return c.json({ error: 'phone required' }, 400);
      if (!id)    return c.json({ error: 'id required' }, 400);
      const clean = aviaClean(phone);
      const count = await Notifs.markRead(clean, id);
      console.log(`[AVIA Notif] read ${id} for ${clean}: marked ${count}`);
      return c.json({ success: true });
    } catch (err) {
      console.log('Error POST /avia/notifications/read:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.post(`${P}/notifications`, async (c) => {
    try {
      const body = await c.req.json();
      const { phone, type, iconName, iconBg, title, description } = body;
      if (!phone || !type || !title) return c.json({ error: 'phone, type and title required' }, 400);
      const clean = aviaClean(phone);
      const id    = aviaId('anotif');
      const notif: AviaNotif = {
        id, phone: clean, type,
        iconName   : iconName    || 'Bell',
        iconBg     : iconBg      || 'bg-sky-500/10 text-sky-400',
        title,
        description: description || '',
        isUnread   : true,
        createdAt  : new Date().toISOString(),
      };
      await Notifs.push(clean, notif);
      return c.json({ success: true, notification: notif });
    } catch (err) {
      console.log('Error POST /avia/notifications:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.delete(`${P}/notifications/:phone/:id`, async (c) => {
    try {
      const phone = aviaClean(decodeURIComponent(c.req.param('phone')));
      const id    = c.req.param('id');
      await Notifs.del(phone, id);
      return c.json({ success: true });
    } catch (err) {
      console.log('Error DELETE /avia/notifications/:phone/:id:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  CHAT
  // ══════════════════════════════════════════════════════════════════════════

  app.post(`${P}/chat/init`, async (c) => {
    try {
      const body  = await c.req.json();
      const p1    = aviaClean(body.senderPhone    || '');
      const p2    = aviaClean(body.recipientPhone || '');
      const adRef = body.adRef || null;

      if (!p1 || !p2) return c.json({ error: 'senderPhone and recipientPhone required' }, 400);
      if (p1 === p2)  return c.json({ error: 'Cannot chat with yourself' }, 400);
      if (p1.length < 9 || p2.length < 9) return c.json({ error: 'Invalid phone numbers' }, 400);

      const chatId   = aviaChatId(p1, p2);
      const existing = await Chats.getMeta(chatId);

      if (!existing) {
        const now  = new Date().toISOString();
        const meta: AviaChatMeta = {
          chatId, participants: [p1, p2], adRef,
          createdAt: now, lastMessage: null, lastMessageAt: null, lastSenderPhone: null,
          unreadBy: { [p1]: 0, [p2]: 0 },
        };
        await Chats.setMeta(chatId, meta);
        await Chats.addUserIndex(p1, chatId);
        await Chats.addUserIndex(p2, chatId);
        console.log(`[AVIA Chat] Created chat ${chatId}`);
        return c.json({ success: true, chatId, meta, isNew: true });
      }

      if (adRef && !existing.adRef) {
        const updated = { ...existing, adRef };
        await Chats.setMeta(chatId, updated);
        return c.json({ success: true, chatId, meta: updated, isNew: false });
      }
      return c.json({ success: true, chatId, meta: existing, isNew: false });
    } catch (err) {
      console.log('Error POST /avia/chat/init:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.get(`${P}/chat/:chatId/messages`, async (c) => {
    try {
      const chatId = c.req.param('chatId');
      if (!chatId) return c.json({ error: 'chatId required' }, 400);
      const [messages, meta] = await Promise.all([
        Chats.getMessages(chatId),
        Chats.getMeta(chatId),
      ]);
      return c.json({ messages, meta: meta || {} });
    } catch (err) {
      console.log('Error GET /avia/chat/:chatId/messages:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.post(`${P}/chat/:chatId/messages`, rlPhone(RL.MESSAGE), async (c) => {
    try {
      const chatId = c.req.param('chatId');
      const body   = await c.req.json();
      const clean  = aviaClean(body.senderPhone || '');
      const text   = (body.text || '').trim();
      const type   = (body.type || 'text') as string;
      const msgMeta = body.meta || undefined;

      if (!chatId || !clean || (!text && type === 'text')) {
        return c.json({ error: 'chatId, senderPhone and text required' }, 400);
      }

      const id  = aviaId();
      const now = new Date().toISOString();
      const message: AviaMessage = { id, chatId, senderPhone: clean, text, createdAt: now, type };
      if (msgMeta) message.meta = msgMeta;
      await Chats.addMessage(chatId, message);

      const meta: AviaChatMeta    = (await Chats.getMeta(chatId)) || { chatId, participants: [clean], createdAt: now, lastMessage: null, lastMessageAt: null, lastSenderPhone: null, unreadBy: {} };
      const participants: string[] = meta.participants || [clean];
      const recipient              = participants.find(p => p !== clean) || '';

      const previewText = type === 'deal_offer'  ? '🤝 Предложение о сделке'
                        : type === 'deal_update' ? '🔔 Статус сделки изменён'
                        : (text.length > 60 ? text.slice(0, 57) + '...' : text);

      await Chats.setMeta(chatId, {
        ...meta, chatId, participants,
        lastMessage: previewText, lastMessageAt: now, lastSenderPhone: clean,
        unreadBy: { ...(meta.unreadBy || {}), ...(recipient ? { [recipient]: (meta.unreadBy?.[recipient] || 0) + 1 } : {}) },
      });

      // Уведомление получателю (только текстовые)
      if (recipient && type === 'text') {
        ;(async () => {
          try {
            const senderUser = await Users.get(clean);
            const senderName = senderUser
              ? (`${senderUser.firstName || ''} ${senderUser.lastName || ''}`.trim() || `+${clean}`)
              : `+${clean}`;
            const preview  = text.length > 50 ? text.slice(0, 47) + '...' : text;
            const notifId  = aviaId('chat');
            await Notifs.push(recipient, {
              id: notifId, phone: recipient, type: 'system',
              iconName: 'MessageCircle', iconBg: 'bg-sky-500/10 text-sky-400',
              title: `Сообщение от ${senderName}`, description: preview,
              isUnread: true, createdAt: now, meta: { chatId },
            });
          } catch (e) { console.log('[AVIA Chat] Notif error (non-fatal):', e); }
        })();
      }

      return c.json({ success: true, message });
    } catch (err) {
      console.log('Error POST /avia/chat/:chatId/messages:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.post(`${P}/chat/:chatId/seen`, async (c) => {
    try {
      const chatId = c.req.param('chatId');
      const { phone } = await c.req.json();
      if (!chatId || !phone) return c.json({ error: 'chatId and phone required' }, 400);
      const clean = aviaClean(phone);
      const meta  = await Chats.getMeta(chatId);
      if (!meta) return c.json({ error: 'Chat not found' }, 404);
      await Chats.setMeta(chatId, {
        ...meta,
        unreadBy  : { ...(meta.unreadBy   || {}), [clean]: 0 },
        lastSeenBy: { ...(meta.lastSeenBy || {}), [clean]: new Date().toISOString() },
      });
      return c.json({ success: true });
    } catch (err) {
      console.log('Error POST /avia/chat/:chatId/seen:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.get(`${P}/chats/user/:phone`, async (c) => {
    try {
      const phone = aviaClean(decodeURIComponent(c.req.param('phone')));
      if (!phone) return c.json({ error: 'phone required' }, 400);
      const chats = await Chats.listByUser(phone);
      return c.json({ chats });
    } catch (err) {
      console.log('Error GET /avia/chats/user/:phone:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.delete(`${P}/chat/:chatId`, async (c) => {
    try {
      const chatId = c.req.param('chatId');
      const { phone } = await c.req.json();
      if (!chatId || !phone) return c.json({ error: 'chatId and phone required' }, 400);
      const clean = aviaClean(phone);
      const meta  = await Chats.getMeta(chatId);
      if (!meta) return c.json({ error: 'Chat not found' }, 404);

      const participants: string[] = meta.participants || [];
      if (!participants.includes(clean)) return c.json({ error: 'Forbidden: not a participant' }, 403);

      const otherPhone     = participants.find(p => p !== clean) || '';
      const now            = new Date().toISOString();
      const cancelledDealIds: string[] = [];

      // Каскадная отмена сделок (fire-and-forget)
      if (otherPhone) {
        ;(async () => {
          try {
            const userDeals = await Deals.listByUser(clean);
            for (const deal of userDeals) {
              if (deal.deletedAt) continue;
              const participants2 = [deal.initiatorPhone, deal.recipientPhone];
              if (!participants2.includes(clean) || !participants2.includes(otherPhone)) continue;
              if (deal.status !== 'pending' && deal.status !== 'accepted') continue;

              await Deals.set(deal.id, { ...deal, status: 'cancelled', cancelledAt: now, updatedAt: now, cancelReason: 'chat_deleted' });
              cancelledDealIds.push(deal.id);

              // Возврат ёмкости рейса
              if ((deal.dealType === 'cargo' || !deal.dealType) && deal.adType === 'flight') {
                const flight = await Flights.get(deal.adId);
                if (flight) {
                  const kg = deal.weightKg || 0;
                  if (deal.status === 'accepted') {
                    await Flights.set(deal.adId, { ...flight, freeKg: (flight.freeKg || 0) + kg, updatedAt: now });
                  } else {
                    await Flights.set(deal.adId, { ...flight, reservedKg: Math.max(0, (flight.reservedKg || 0) - kg), updatedAt: now });
                  }
                }
              }
            }
            if (cancelledDealIds.length > 0) {
              await Notifs.push(otherPhone, {
                id: aviaId('chat_deleted'), phone: otherPhone, type: 'system',
                iconName: 'XCircle', iconBg: 'bg-rose-500/10 text-rose-400',
                title: 'Чат удалён',
                description: `Пользователь удалил чат. ${cancelledDealIds.length} сделок отменено.`,
                isUnread: true, createdAt: now,
              });
            }
          } catch (e) { console.warn('[AVIA Chat Delete] cascade error:', e); }
        })();
      }

      // Удаляем сообщения, мета, индексы
      await Promise.all([
        Chats.delMessages(chatId),
        Chats.delMeta(chatId),
        Chats.delUserIndex(clean, chatId),
        otherPhone ? Chats.delUserIndex(otherPhone, chatId) : Promise.resolve(),
      ]);

      console.log(`[AVIA Chat] DELETE ${chatId} by ${clean}`);
      return c.json({ success: true, cancelledDealIds });
    } catch (err) {
      console.log('Error DELETE /avia/chat/:chatId:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  DEALS
  // ══════════════════════════════════════════════════════════════════════════

  app.post(`${P}/deals`, rlPhone(RL.DEAL_CREATE), async (c) => {
    try {
      const body = await c.req.json();
      const { initiatorPhone, initiatorName, recipientPhone, recipientName, adType, adId, adFrom, adTo, adDate, weightKg, price, currency, message, courierId, senderId, courierName, senderName, dealType } = body;

      if (!initiatorPhone || !recipientPhone || !adType || !adId || !courierId || !senderId) return c.json({ error: 'Missing required fields' }, 400);

      const p1 = aviaClean(initiatorPhone);
      const p2 = aviaClean(recipientPhone);
      if (!p1 || !p2) return c.json({ error: 'Invalid phone numbers' }, 400);
      if (p1 === p2)  return c.json({ error: 'Cannot make a deal with yourself' }, 400);

      const resolvedDealType: 'cargo' | 'docs' = dealType === 'docs' ? 'docs' : 'cargo';

      // Проверка дубликата
      const duplicate = await Deals.findActiveByInitiatorAndAd(p1, adId, adType, p2);
      if (duplicate) return c.json({ error: 'Вы уже отправили предложение по этому объявлению', dealId: duplicate.id }, 409);

      // Резервирование ёмкости (грузовые сделки по рейсу)
      if (resolvedDealType === 'cargo' && adType === 'flight') {
        const flight = await Flights.get(adId);
        if (flight?.cargoEnabled) {
          const available = (flight.freeKg || 0) - (flight.reservedKg || 0);
          const requested = Number(weightKg) || 0;
          if (requested > available) return c.json({ error: `Недостаточно места: доступно ${available} кг, запрошено ${requested} кг` }, 400);
          await Flights.set(adId, { ...flight, reservedKg: (flight.reservedKg || 0) + requested, updatedAt: new Date().toISOString() });
        }
      }

      const id  = aviaId('aviadeal');
      const now = new Date().toISOString();
      const deal: AviaDeal = {
        id,
        initiatorPhone: p1, initiatorName: initiatorName || p1,
        recipientPhone: p2, recipientName: recipientName || p2,
        adType, adId,
        adFrom: adFrom || '', adTo: adTo || '', adDate: adDate || null,
        weightKg    : resolvedDealType === 'cargo' ? (Number(weightKg) || 0) : 0,
        price       : price ? Number(price) : null,
        currency    : currency || 'USD',
        message     : message || '',
        courierId   : aviaClean(courierId),
        senderId    : aviaClean(senderId),
        courierName : courierName || '',
        senderName  : senderName  || '',
        dealType    : resolvedDealType,
        status      : 'pending',
        createdAt   : now,
        updatedAt   : now,
      };

      await Deals.set(id, deal);
      await Deals.addParticipant(p1, id, 'initiator');
      await Deals.addParticipant(p2, id, 'recipient');

      // Уведомление получателю (fire-and-forget)
      ;(async () => {
        try {
          const route   = `${adFrom || '?'} → ${adTo || '?'}`;
          const notifId = aviaId('deal');
          await Notifs.push(p2, {
            id: notifId, phone: p2, type: 'request',
            iconName: 'Handshake', iconBg: 'bg-emerald-500/10 text-emerald-400',
            title      : `Новое предложение от ${initiatorName || p1}`,
            description: `Маршрут: ${route}${price ? ` · $${price}` : ''}`,
            isUnread: true, createdAt: now, meta: { dealId: id },
          });
        } catch (e) { console.warn('[AVIA Deals] Notif error:', e); }
      })();

      console.log(`[AVIA Deals] Created deal ${id}: ${p1} → ${p2}`);
      return c.json({ success: true, deal });
    } catch (err) {
      console.log('Error POST /avia/deals:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.get(`${P}/deals/:id`, async (c) => {
    try {
      const id   = c.req.param('id');
      const deal = await Deals.get(id);
      if (!deal) return c.json({ error: 'Deal not found' }, 404);
      return c.json({ deal });
    } catch (err) {
      console.log('Error GET /avia/deals/:id:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.get(`${P}/deals/user/:phone`, async (c) => {
    try {
      const phone = aviaClean(decodeURIComponent(c.req.param('phone')));
      if (!phone) return c.json({ error: 'phone required' }, 400);
      const deals = await Deals.listByUser(phone);
      return c.json({ deals });
    } catch (err) {
      console.log('Error GET /avia/deals/user/:phone:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  // ── Deal status transitions ───────────────────────────────────────────────

  async function injectDealUpdateMessage(deal: AviaDeal, text: string, status: string): Promise<void> {
    const chatId = aviaChatId(deal.initiatorPhone, deal.recipientPhone);
    const meta   = await Chats.getMeta(chatId);
    if (!meta) return;
    const msgId = aviaId('deal_update');
    const now   = new Date().toISOString();
    await Chats.addMessage(chatId, { id: msgId, chatId, senderPhone: 'system', text, type: 'deal_update', meta: { dealId: deal.id, status }, createdAt: now });
    await Chats.setMeta(chatId, { ...meta, lastMessage: `${status === 'accepted' ? '🤝' : status === 'rejected' ? '❌' : status === 'cancelled' ? '🚫' : '⭐'} ${text}`, lastMessageAt: now, lastSenderPhone: 'system' });
  }

  app.patch(`${P}/deals/:id/accept`, async (c) => {
    try {
      const id    = c.req.param('id');
      const { phone } = await c.req.json();
      if (!phone) return c.json({ error: 'phone required' }, 400);
      const clean = aviaClean(phone);
      const deal  = await Deals.get(id);
      if (!deal) return c.json({ error: 'Deal not found' }, 404);
      if (deal.recipientPhone !== clean) return c.json({ error: 'Forbidden: not the recipient' }, 403);
      if (deal.status !== 'pending')     return c.json({ error: `Cannot accept deal with status: ${deal.status}` }, 400);

      const now     = new Date().toISOString();
      const updated = { ...deal, status: 'accepted', acceptedAt: now, updatedAt: now };
      await Deals.set(id, updated);

      // Декремент freeKg при грузовой сделке
      if ((deal.dealType === 'cargo' || !deal.dealType) && deal.adType === 'flight') {
        const flight = await Flights.get(deal.adId);
        if (flight) {
          const kg = deal.weightKg || 0;
          await Flights.set(deal.adId, { ...flight, freeKg: Math.max(0, (flight.freeKg || 0) - kg), reservedKg: Math.max(0, (flight.reservedKg || 0) - kg), updatedAt: now });
        }
      }

      await injectDealUpdateMessage(deal, 'Предложение принято', 'accepted');

      await Notifs.push(deal.initiatorPhone, {
        id: aviaId('deal_accept'), phone: deal.initiatorPhone, type: 'request',
        iconName: 'CheckCircle2', iconBg: 'bg-emerald-500/10 text-emerald-400',
        title: 'Предложение принято!',
        description: `${deal.recipientName || deal.recipientPhone} принял ваше предложение · ${deal.adFrom} → ${deal.adTo}`,
        isUnread: true, createdAt: now, meta: { dealId: id },
      });

      console.log(`[AVIA Deals] Accepted deal ${id} by ${clean}`);
      return c.json({ success: true, deal: updated });
    } catch (err) {
      console.log('Error PATCH /avia/deals/:id/accept:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.patch(`${P}/deals/:id/reject`, async (c) => {
    try {
      const id     = c.req.param('id');
      const { phone, reason } = await c.req.json();
      if (!phone) return c.json({ error: 'phone required' }, 400);
      const clean = aviaClean(phone);
      const deal  = await Deals.get(id);
      if (!deal) return c.json({ error: 'Deal not found' }, 404);
      if (deal.recipientPhone !== clean) return c.json({ error: 'Forbidden: not the recipient' }, 403);
      if (deal.status !== 'pending')     return c.json({ error: `Cannot reject deal with status: ${deal.status}` }, 400);

      const now     = new Date().toISOString();
      const updated = { ...deal, status: 'rejected', rejectedAt: now, updatedAt: now, rejectReason: reason || '' };
      await Deals.set(id, updated);

      // Возврат резервирования
      if ((deal.dealType === 'cargo' || !deal.dealType) && deal.adType === 'flight') {
        const flight = await Flights.get(deal.adId);
        if (flight) await Flights.set(deal.adId, { ...flight, reservedKg: Math.max(0, (flight.reservedKg || 0) - (deal.weightKg || 0)), updatedAt: now });
      }

      await injectDealUpdateMessage(deal, 'Предложение отклонено', 'rejected');
      await Notifs.push(deal.initiatorPhone, {
        id: aviaId('deal_reject'), phone: deal.initiatorPhone, type: 'system',
        iconName: 'XCircle', iconBg: 'bg-red-500/10 text-red-400',
        title: 'Предложение отклонено',
        description: `${deal.recipientName || deal.recipientPhone} отклонил предложение · ${deal.adFrom} → ${deal.adTo}`,
        isUnread: true, createdAt: now, meta: { dealId: id },
      });

      console.log(`[AVIA Deals] Rejected deal ${id} by ${clean}`);
      return c.json({ success: true, deal: updated });
    } catch (err) {
      console.log('Error PATCH /avia/deals/:id/reject:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.patch(`${P}/deals/:id/cancel`, async (c) => {
    try {
      const id     = c.req.param('id');
      const { phone } = await c.req.json();
      if (!phone) return c.json({ error: 'phone required' }, 400);
      const clean = aviaClean(phone);
      const deal  = await Deals.get(id);
      if (!deal) return c.json({ error: 'Deal not found' }, 404);
      if (deal.initiatorPhone !== clean) return c.json({ error: 'Forbidden: not the initiator' }, 403);
      if (deal.status !== 'pending')     return c.json({ error: `Cannot cancel deal with status: ${deal.status}` }, 400);

      const now     = new Date().toISOString();
      const updated = { ...deal, status: 'cancelled', cancelledAt: now, updatedAt: now };
      await Deals.set(id, updated);

      if ((deal.dealType === 'cargo' || !deal.dealType) && deal.adType === 'flight') {
        const flight = await Flights.get(deal.adId);
        if (flight) await Flights.set(deal.adId, { ...flight, reservedKg: Math.max(0, (flight.reservedKg || 0) - (deal.weightKg || 0)), updatedAt: now });
      }

      await injectDealUpdateMessage(deal, 'Предложение отменено', 'cancelled');
      await Notifs.push(deal.recipientPhone, {
        id: aviaId('deal_cancel'), phone: deal.recipientPhone, type: 'system',
        iconName: 'XCircle', iconBg: 'bg-rose-500/10 text-rose-400',
        title: 'Предложение отменено',
        description: `${deal.initiatorName || deal.initiatorPhone} отменил предложение · ${deal.adFrom} → ${deal.adTo}`,
        isUnread: true, createdAt: now, meta: { dealId: id },
      });

      console.log(`[AVIA Deals] Cancelled deal ${id} by ${clean}`);
      return c.json({ success: true, deal: updated });
    } catch (err) {
      console.log('Error PATCH /avia/deals/:id/cancel:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.patch(`${P}/deals/:id/complete`, async (c) => {
    try {
      const id     = c.req.param('id');
      const { phone } = await c.req.json();
      if (!phone) return c.json({ error: 'phone required' }, 400);
      const clean = aviaClean(phone);
      const deal  = await Deals.get(id);
      if (!deal) return c.json({ error: 'Deal not found' }, 404);
      const isParticipant = deal.courierId === clean || deal.senderId === clean;
      if (!isParticipant)           return c.json({ error: 'Forbidden: not a participant' }, 403);
      if (deal.status !== 'accepted') return c.json({ error: `Cannot complete deal with status: ${deal.status}` }, 400);

      const now     = new Date().toISOString();
      const updated = { ...deal, status: 'completed', completedAt: now, updatedAt: now };
      await Deals.set(id, updated);

      await injectDealUpdateMessage(deal, 'Сделка завершена', 'completed');

      const other  = clean === deal.courierId ? deal.senderId : deal.courierId;
      const myName = clean === deal.courierId ? (deal.courierName || deal.courierId) : (deal.senderName || deal.senderId);
      await Notifs.push(other, {
        id: aviaId('deal_complete'), phone: other, type: 'system',
        iconName: 'Star', iconBg: 'bg-yellow-500/10 text-yellow-400',
        title: 'Сделка завершена!',
        description: `${myName} завершил сделку · ${deal.adFrom} → ${deal.adTo}`,
        isUnread: true, createdAt: now, meta: { dealId: id },
      });

      console.log(`[AVIA Deals] Completed deal ${id} by ${clean}`);
      return c.json({ success: true, deal: updated });
    } catch (err) {
      console.log('Error PATCH /avia/deals/:id/complete:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  STATS & PUBLIC PROFILE
  // ══════════════════════════════════════════════════════════════════════════

  app.get(`${P}/stats/:phone`, async (c) => {
    try {
      const phone  = aviaClean(decodeURIComponent(c.req.param('phone')));
      if (!phone) return c.json({ error: 'phone required' }, 400);

      const cached = aviaCache.get(CK.stats(phone));
      if (cached) return c.json({ stats: cached });

      const [flights, requests, deals, chats] = await Promise.all([
        Flights.listByCourier(phone),
        Requests.listBySender(phone),
        Deals.listByUser(phone),
        Chats.listByUser(phone),
      ]);

      const stats = {
        flightsTotal   : flights.length,
        flightsActive  : flights.filter(f => f.status !== 'closed' && f.status !== 'completed').length,
        requestsTotal  : requests.length,
        requestsActive : requests.filter(r => r.status !== 'closed').length,
        chatsTotal     : chats.length,
        dealsTotal     : deals.length,
        dealsActive    : deals.filter(d => d.status === 'accepted').length,
        dealsPending   : deals.filter(d => d.status === 'pending').length,
        dealsCompleted : deals.filter(d => d.status === 'completed').length,
      };

      aviaCache.set(CK.stats(phone), stats, TTL.STATS);
      return c.json({ stats });
    } catch (err) {
      console.log('Error GET /avia/stats/:phone:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  REVIEWS
  // ══════════════════════════════════════════════════════════════════════════

  app.post(`${P}/reviews`, rlPhone(RL.GENERAL_WRITE), async (c) => {
    try {
      const body = await c.req.json();
      const { dealId, authorPhone, type, comment } = body;

      if (!dealId || !authorPhone || !type) return c.json({ error: 'dealId, authorPhone, type are required' }, 400);
      if (type !== 'like' && type !== 'dislike') return c.json({ error: 'type must be "like" or "dislike"' }, 400);
      if (!comment || comment.trim().length < 10) return c.json({ error: 'Комментарий обязателен (минимум 10 символов)' }, 400);

      const deal = await Deals.get(dealId);
      if (!deal) return c.json({ error: 'Deal not found' }, 404);
      if (!['completed', 'accepted', 'cancelled', 'rejected'].includes(deal.status)) return c.json({ error: 'Отзыв можно оставить только по завершённой сделке' }, 403);

      const cleanAuthor = aviaClean(authorPhone);
      const isInitiator = deal.initiatorPhone === cleanAuthor;
      const isRecipient = deal.recipientPhone === cleanAuthor;
      if (!isInitiator && !isRecipient) return c.json({ error: 'Вы не являетесь участником этой сделки' }, 403);

      const reviewed = await Reviews.getDealStatus(dealId);
      if (isInitiator && reviewed.byInitiator) return c.json({ error: 'Вы уже оставили отзыв по этой сделке' }, 409);
      if (isRecipient && reviewed.byRecipient) return c.json({ error: 'Вы уже оставили отзыв по этой сделке' }, 409);

      const authorUser = await Users.get(cleanAuthor);
      const authorName = authorUser
        ? [authorUser.firstName, authorUser.lastName].filter(Boolean).join(' ') || authorPhone
        : authorPhone;

      const recipientPhone = isInitiator ? deal.recipientPhone : deal.initiatorPhone;
      const authorRole     = cleanAuthor === deal.courierId ? 'courier' : 'sender';

      const review: AviaReview = {
        id           : aviaId(),
        dealId,
        authorPhone  : cleanAuthor,
        authorName,
        recipientPhone,
        type         : type as 'like' | 'dislike',
        comment      : comment.trim().slice(0, 300),
        authorRole,
        createdAt    : new Date().toISOString(),
      };

      await Reviews.add(review);
      await Reviews.setDealStatus(dealId, {
        byInitiator: reviewed.byInitiator || isInitiator,
        byRecipient: reviewed.byRecipient || isRecipient,
      });

      // Уведомление (fire-and-forget)
      ;(async () => {
        try {
          const emoji   = type === 'like' ? '👍' : '👎';
          const notifId = aviaId('review');
          await Notifs.push(recipientPhone, {
            id: notifId, phone: recipientPhone, type: 'system',
            iconName: type === 'like' ? 'ThumbsUp' : 'ThumbsDown',
            iconBg  : type === 'like' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
            title   : type === 'like' ? 'Новый лайк!' : 'Новый дизлайк',
            description: `${emoji} ${review.comment.slice(0, 80)}`,
            isUnread: true, createdAt: new Date().toISOString(), meta: { reviewId: review.id },
          });
        } catch (e) { console.warn('[AVIA Reviews] Notif error:', e); }
      })();

      console.log(`[AVIA Reviews] Created review ${review.id} by ${cleanAuthor} for ${recipientPhone}`);
      return c.json({ success: true, review });
    } catch (err) {
      console.log('Error POST /avia/reviews:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.get(`${P}/reviews/deal/:dealId`, async (c) => {
    try {
      const dealId   = decodeURIComponent(c.req.param('dealId'));
      const reviewed = await Reviews.getDealStatus(dealId);
      return c.json({ reviewed });
    } catch (err) {
      console.log('Error GET /avia/reviews/deal/:dealId:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  app.get(`${P}/reviews/user/:phone`, async (c) => {
    try {
      const phone   = aviaClean(decodeURIComponent(c.req.param('phone')));
      const reviews = await Reviews.listByUser(phone);
      return c.json({ reviews });
    } catch (err) {
      console.log('Error GET /avia/reviews/user/:phone:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  PUBLIC PROFILE (phone → profile + reviews + stats)
  // ══════════════════════════════════════════════════════════════════════════

  app.get(`${P}/public-profile/:phone`, async (c) => {
    try {
      const phone  = aviaClean(decodeURIComponent(c.req.param('phone')));
      if (!phone) return c.json({ error: 'phone required' }, 400);

      const cached = aviaCache.get(CK.publicProfile(phone));
      if (cached) return c.json(cached);

      const [profile, reviews, deals] = await Promise.all([
        Users.get(phone),
        Reviews.listByUser(phone),
        Deals.listByUser(phone),
      ]);

      const validReviews  = reviews.filter(r => r && r.id);
      const likes         = validReviews.filter(r => r.type === 'like').length;
      const dislikes      = validReviews.filter(r => r.type === 'dislike').length;
      const dealsCompleted = deals.filter(d => d.status === 'completed').length;

      const result = {
        profile: {
          phone,
          firstName    : profile?.firstName    || null,
          lastName     : profile?.lastName     || null,
          role         : profile?.role         || null,
          likes,
          dislikes,
          reviewsCount : validReviews.length,
          dealsCompleted,
          createdAt    : profile?.createdAt    || null,
        },
        reviews: validReviews.slice(0, 50),
      };

      aviaCache.set(CK.publicProfile(phone), result, TTL.PUBLIC_PROFILE);
      return c.json(result);
    } catch (err) {
      console.log('Error GET /avia/public-profile/:phone:', err);
      return c.json({ error: `${err}` }, 500);
    }
  });

  console.log('[AVIA] Routes registered. Architecture: Repository + Cache + RateLimit');
}
