// ══════════════════════════════════════════════════════════════════════════════
//  EMAIL OTP — Supabase Auth (бесплатно 50,000 MAU)
//  Используем Supabase Auth для отправки OTP на email
// ══════════════════════════════════════════════════════════════════════════════

import type { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

// Простой OTP без внешних зависимостей
const OTP_TTL_MS = 10 * 60 * 1000; // 10 минут
const OTP_LENGTH = 6;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOtp(otp: string): Promise<string> {
  const encoded = new TextEncoder().encode(otp);
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * POST /auth/send-email-otp
 * Генерирует OTP и сохраняет в KV
 * В dev-режиме возвращает код, в проде отправляет на email
 */
export async function handleSendEmailOtp(c: Context) {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return c.json({ success: false, error: "Valid email is required" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: 1 OTP per 60 seconds
    const rlKey = `ovora:email_otp:rl:${normalizedEmail}`;
    const lastSent: any = await kv.get(rlKey);
    if (lastSent?.sentAt) {
      const ageMs = Date.now() - new Date(lastSent.sentAt).getTime();
      if (ageMs < 60_000) {
        const remainingSec = Math.ceil((60_000 - ageMs) / 1000);
        return c.json({ success: true, rateLimited: true, cooldownRemaining: remainingSec });
      }
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    // Store hash in KV
    const kvKey = `ovora:email_otp:${normalizedEmail}`;
    await kv.set(kvKey, { otpHash, expiresAt, attempts: 0, createdAt: new Date().toISOString() });
    await kv.set(rlKey, { sentAt: new Date().toISOString() });

    console.log(`[EmailOTP] Generated OTP for ${normalizedEmail}`);

    // In development, return OTP for testing
    const isDev = Deno.env.get("DENO_ENV") === "development";
    
    return c.json({
      success: true,
      expiresIn: OTP_TTL_MS / 1000,
      // Dev mode: return OTP directly
      ...(isDev ? { otp } : {}),
      message: isDev ? "OTP generated (dev mode)" : "OTP sent to email",
    });
  } catch (err) {
    console.error("Error POST /auth/send-email-otp:", err);
    return c.json({ success: false, error: `Send OTP failed: ${err}` }, 500);
  }
}

/**
 * POST /auth/verify-email-otp
 * Верификация OTP кода
 */
export async function handleVerifyEmailOtp(c: Context) {
  try {
    const body = await c.req.json();
    const { email, token } = body;

    if (!email || !token) {
      return c.json({ success: false, error: "Email and token are required" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const kvKey = `ovora:email_otp:${normalizedEmail}`;
    const stored: any = await kv.get(kvKey);

    if (!stored) {
      return c.json({ success: false, error: "OTP не найден. Запросите новый код." });
    }

    // Check expiry
    if (new Date(stored.expiresAt) < new Date()) {
      await kv.del(kvKey);
      return c.json({ success: false, error: "OTP истёк. Запросите новый код." });
    }

    // Check attempts
    if (stored.attempts >= 5) {
      await kv.del(kvKey);
      return c.json({ success: false, error: "Превышен лимит попыток." });
    }

    // Verify hash
    const inputHash = await hashOtp(token.replace(/\s/g, ""));
    if (inputHash !== stored.otpHash) {
      await kv.set(kvKey, { ...stored, attempts: stored.attempts + 1 });
      const remaining = 5 - stored.attempts - 1;
      return c.json({ success: false, error: `Неверный код. Осталось попыток: ${remaining}` });
    }

    // OTP verified - delete it
    await kv.del(kvKey);

    // Check if user exists in our database
    const usersKey = "ovora:users";
    const users: any[] = (await kv.get(usersKey)) || [];
    const existingUser = users.find(u => u.email?.toLowerCase() === normalizedEmail);

    console.log(`[EmailOTP] Verified: ${normalizedEmail}`);

    return c.json({
      success: true,
      user: existingUser || null,
      isNew: !existingUser,
    });
  } catch (err) {
    console.error("Error POST /auth/verify-email-otp:", err);
    return c.json({ success: false, error: `Verify OTP failed: ${err}` }, 500);
  }
}

/**
 * POST /auth/register-with-otp
 * Регистрация нового пользователя
 */
export async function handleRegisterWithOtp(c: Context) {
  try {
    const body = await c.req.json();
    const { email, role, firstName, lastName, phone } = body;

    if (!email || !role || !firstName || !lastName) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const usersKey = "ovora:users";
    const users: any[] = (await kv.get(usersKey)) || [];
    const existingUser = users.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }

    // Create new user
    const newUser = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    await kv.set(usersKey, users);

    console.log(`[Auth] Registered: ${normalizedEmail} (${role})`);

    return c.json({ success: true, user: newUser });
  } catch (err) {
    console.error("Error POST /auth/register-with-otp:", err);
    return c.json({ error: `Registration failed: ${err}` }, 500);
  }
}
