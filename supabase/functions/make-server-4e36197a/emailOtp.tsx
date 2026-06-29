// ══════════════════════════════════════════════════════════════════════════════
//  EMAIL OTP — Supabase Auth integration
//  Отправка OTP на email через Resend API
//  Верификация OTP и регистрация/вход пользователя
// ══════════════════════════════════════════════════════════════════════════════

import type { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

const OTP_RATE_LIMIT_MS = 60_000;
const OTP_TTL_MS = 10 * 60 * 1000;

async function hashOtp(otp: string): Promise<string> {
  const encoded = new TextEncoder().encode(otp.trim());
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function handleSendEmailOtp(c: Context) {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return c.json({ success: false, error: "Valid email is required" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const rlKey = `ovora:email_otp:rl:${normalizedEmail}`;
    const lastSent: any = await kv.get(rlKey);
    if (lastSent?.sentAt) {
      const ageMs = Date.now() - new Date(lastSent.sentAt).getTime();
      if (ageMs < OTP_RATE_LIMIT_MS) {
        const remainingSec = Math.ceil((OTP_RATE_LIMIT_MS - ageMs) / 1000);
        return c.json({ success: true, rateLimited: true, cooldownRemaining: remainingSec });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const kvKey = `ovora:email_otp:${normalizedEmail}`;
    await kv.set(kvKey, { otpHash, expiresAt, attempts: 0, createdAt: new Date().toISOString() });
    await kv.set(rlKey, { sentAt: new Date().toISOString() });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: Deno.env.get("EMAIL_FROM") || "Ovora Cargo <onboarding@resend.dev>",
            to: [normalizedEmail],
            subject: "Ваш код верификации Ovora Cargo",
            html: `<div style="font-family:Arial,sans-serif;padding:20px;background:#060e1a;color:white">
              <h2 style="color:#5ba3f5">Ваш код верификации</h2>
              <p>Используйте этот код для входа:</p>
              <div style="background:#1a2a3a;padding:20px;border-radius:12px;text-align:center;margin:20px 0">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#5ba3f5">${otp}</span>
              </div>
              <p style="color:#607080;font-size:12px">Код действителен 10 минут.</p>
            </div>`,
          }),
        });
        console.log(`[EmailOTP] ✅ Sent to ${normalizedEmail}`);
      } catch (err) {
        console.error(`[EmailOTP] Failed to send email:`, err);
      }
    } else {
      console.log(`[EmailOTP] ⚠️ No RESEND_API_KEY - OTP: ${otp}`);
    }

    return c.json({
      success: true,
      expiresIn: OTP_TTL_MS / 1000,
      ...(Deno.env.get("DENO_ENV") === "development" ? { otp } : {}),
    });
  } catch (err) {
    console.error("Error POST /auth/send-email-otp:", err);
    return c.json({ success: false, error: `Send OTP failed: ${err}` }, 500);
  }
}

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

    if (new Date(stored.expiresAt) < new Date()) {
      await kv.del(kvKey);
      return c.json({ success: false, error: "OTP истёк. Запросите новый код." });
    }

    if (stored.attempts >= 5) {
      await kv.del(kvKey);
      return c.json({ success: false, error: "Превышен лимит попыток." });
    }

    const inputHash = await hashOtp(token.replace(/\s/g, ""));
    if (inputHash !== stored.otpHash) {
      await kv.set(kvKey, { ...stored, attempts: stored.attempts + 1 });
      const remaining = 5 - stored.attempts - 1;
      return c.json({ success: false, error: `Неверный код. Осталось попыток: ${remaining}` });
    }

    await kv.del(kvKey);

    const usersKey = "ovora:users";
    const users: any[] = (await kv.get(usersKey)) || [];
    const existingUser = users.find(u => u.email?.toLowerCase() === normalizedEmail);

    return c.json({ success: true, user: existingUser || null, isNew: !existingUser });
  } catch (err) {
    console.error("Error POST /auth/verify-email-otp:", err);
    return c.json({ success: false, error: `Verify OTP failed: ${err}` }, 500);
  }
}

export async function handleRegisterWithOtp(c: Context) {
  try {
    const body = await c.req.json();
    const { email, role, firstName, lastName, phone } = body;

    if (!email || !role || !firstName || !lastName) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const usersKey = "ovora:users";
    const users: any[] = (await kv.get(usersKey)) || [];
    const existingUser = users.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }

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

    console.log(`[Auth] ✅ Registered: ${normalizedEmail} (${role})`);
    return c.json({ success: true, user: newUser });
  } catch (err) {
    console.error("Error POST /auth/register-with-otp:", err);
    return c.json({ error: `Registration failed: ${err}` }, 500);
  }
}
