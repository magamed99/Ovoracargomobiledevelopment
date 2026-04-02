// ══════════════════════════════════════════════════════════════════════════════
//  CRYPTO VERIFICATION CODES
//  Генерация: crypto.getRandomValues → 8-символьный код (Base32-алфавит)
//  Хранение:  только SHA-256 хеш кода в KV (сырой код нигде не сохраняется)
//  Доставка:  сырой код → фронтенд → уведомление на сайте
//  Верификация: SHA-256(введённый код) === хеш в KV
// ══════════════════════════════════════════════════════════════════════════════

import type { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

// Алфавит без двусмысленных символов (0/O, 1/I/L исключены)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const TTL_MS = 10 * 60 * 1000; // 10 минут
const MAX_ATTEMPTS = 5;

// ── Crypto helpers ─────────────────────────────────────────────────────────────

/**
 * Генерирует криптографически стойкий код длиной CODE_LENGTH
 * из алфавита ALPHABET через crypto.getRandomValues
 */
export function generateCryptoCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => ALPHABET[b % ALPHABET.length])
    .join('');
}

/**
 * Форматирует код для отображения: XXXX-XXXX
 */
export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * SHA-256 хеш кода (для хранения в KV)
 */
async function hashCode(code: string): Promise<string> {
  const encoded = new TextEncoder().encode(code.toUpperCase().replace(/-/g, ''));
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Route handlers ────────────────────────────────────────────────────────────

/**
 * POST /auth/send-otp
 * body: { identifier: string, type: 'email' | 'phone' }
 *
 * Генерирует крипто-код, сохраняет только SHA-256 хеш в KV,
 * возвращает сырой код фронтенду для показа в уведомлении на сайте.
 */
export async function handleSendOtp(c: Context) {
  try {
    const body = await c.req.json();
    const { identifier, type } = body;

    if (!identifier || !type) {
      return c.json({ error: "identifier and type are required" }, 400);
    }
    if (!["email", "phone"].includes(type)) {
      return c.json({ error: "type must be 'email' or 'phone'" }, 400);
    }

    const normalizedId =
      type === "email"
        ? identifier.toLowerCase().trim()
        : identifier.replace(/\D/g, "");

    if (!normalizedId) {
      return c.json({ error: "Invalid identifier" }, 400);
    }

    // ── Rate limit: 1 запрос / 60 сек ────────────────────────────────────────
    const rlKey = `ovora:otp:rl:${type}:${normalizedId}`;
    const lastSent: any = await kv.get(rlKey);
    if (lastSent?.sentAt) {
      const ageMs = Date.now() - new Date(lastSent.sentAt).getTime();
      if (ageMs < 60_000) {
        const remainingSec = Math.ceil((60_000 - ageMs) / 1000);
        console.log(`[OTP] ⏳ Rate-limit: ${type}:${normalizedId} — ${remainingSec}s left`);
        return c.json({
          success: true,
          rateLimited: true,
          cooldownRemaining: remainingSec,
          expiresIn: 600,
        });
      }
    }

    // ── Генерация кода и хеша ─────────────────────────────────────────────────
    const rawCode = generateCryptoCode();
    const codeHash = await hashCode(rawCode);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TTL_MS).toISOString();

    // В KV сохраняем ТОЛЬКО хеш — сырой код нигде не хранится
    const kvKey = `ovora:otp:${type}:${normalizedId}`;
    await kv.set(kvKey, {
      codeHash,          // SHA-256 хеш
      expiresAt,
      attempts: 0,
      createdAt: now.toISOString(),
    });
    await kv.set(rlKey, { sentAt: now.toISOString() });

    console.log(`[OTP] 🔐 Crypto code generated for ${type}:${normalizedId} | hash: ${codeHash.slice(0, 12)}... | expires: ${expiresAt}`);

    // Возвращаем сырой код фронтенду — он будет показан через уведомление на сайте
    return c.json({
      success: true,
      code: formatCode(rawCode),   // XXXX-XXXX для отображения
      expiresIn: 600,
      message: "Crypto code generated. Show in site notification.",
    });
  } catch (err) {
    console.log("Error POST /auth/send-otp:", err);
    return c.json({ error: `Send OTP failed: ${err}` }, 500);
  }
}

/**
 * POST /auth/verify-otp
 * body: { identifier: string, type: 'email' | 'phone', code: string }
 *
 * Хеширует введённый код и сравнивает с хешем в KV.
 * Сырой код никогда не сравнивается напрямую — только хеши.
 */
export async function handleVerifyOtp(c: Context) {
  try {
    const body = await c.req.json();
    const { identifier, type, code } = body;

    if (!identifier || !type || !code) {
      return c.json({ success: false, error: "identifier, type and code are required" }, 400);
    }

    const normalizedId =
      type === "email"
        ? identifier.toLowerCase().trim()
        : identifier.replace(/\D/g, "");

    const kvKey = `ovora:otp:${type}:${normalizedId}`;
    const otpData: any = await kv.get(kvKey);

    if (!otpData) {
      console.log(`[OTP] ❌ No code found for ${type}:${normalizedId}`);
      return c.json({
        success: false,
        error: "Код не найден или истёк срок действия. Запросите новый.",
      });
    }

    // Проверка TTL
    if (new Date() > new Date(otpData.expiresAt)) {
      await kv.del(kvKey);
      console.log(`[OTP] ❌ Code expired for ${type}:${normalizedId}`);
      return c.json({
        success: false,
        error: "Срок действия кода истёк. Запросите новый.",
      });
    }

    // Проверка лимита попыток
    const attempts = (otpData.attempts || 0) + 1;
    if (attempts > MAX_ATTEMPTS) {
      await kv.del(kvKey);
      console.log(`[OTP] ❌ Max attempts (${MAX_ATTEMPTS}) exceeded for ${type}:${normalizedId}`);
      return c.json({
        success: false,
        error: "Превышено количество попыток. Запросите новый код.",
      });
    }

    // SHA-256 хеш введённого кода
    const enteredHash = await hashCode(code);

    if (enteredHash !== otpData.codeHash) {
      await kv.set(kvKey, { ...otpData, attempts });
      const remaining = MAX_ATTEMPTS - attempts;
      console.log(`[OTP] ❌ Wrong code for ${type}:${normalizedId} (attempt ${attempts}/${MAX_ATTEMPTS})`);
      return c.json({
        success: false,
        error: remaining > 0
          ? `Неверный код. Осталось попыток: ${remaining}.`
          : "Превышено количество попыток. Запросите новый код.",
        attemptsLeft: remaining,
      });
    }

    // ✅ Хеши совпали — удаляем (одноразовый)
    await kv.del(kvKey);
    console.log(`[OTP] ✅ Code verified for ${type}:${normalizedId}`);
    return c.json({ success: true, message: "Код подтверждён успешно" });

  } catch (err) {
    console.log("Error POST /auth/verify-otp:", err);
    return c.json({ error: `Verify OTP failed: ${err}` }, 500);
  }
}
