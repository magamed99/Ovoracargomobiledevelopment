// ══════════════════════════════════════════════════════════════════════════════
//  EMAIL OTP — Resend API (100 писем/день бесплатно)
// ══════════════════════════════════════════════════════════════════════════════

import type { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

const OTP_TTL_MS = 10 * 60 * 1000;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOtp(otp: string): Promise<string> {
  const encoded = new TextEncoder().encode(otp);
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sendEmail(to: string, otp: string): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.log(`[EmailOTP] ⚠️ No RESEND_API_KEY — OTP: ${otp}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Ovora Cargo <onboarding@resend.dev>",
        to: [to],
        subject: "Код верификации Ovora Cargo",
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#060e1a;font-family:Arial,sans-serif;">
<div style="max-width:400px;margin:40px auto;padding:32px;background:#0d1a28;border-radius:16px;border:1px solid #1a2e42;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="width:64px;height:64px;margin:0 auto;background:linear-gradient(135deg,#1d4ed8,#2563eb);border-radius:16px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:28px;">🔐</span>
    </div>
  </div>
  <h1 style="color:#fff;font-size:22px;font-weight:900;text-align:center;margin:0 0 8px;">Ваш код верификации</h1>
  <p style="color:#607080;font-size:14px;text-align:center;margin:0 0 24px;">Используйте этот код для входа в Ovora Cargo</p>
  <div style="background:#1a2a3a;padding:20px;border-radius:12px;text-align:center;margin:0 0 24px;">
    <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#5ba3f5;font-family:monospace;">${otp}</span>
  </div>
  <p style="color:#607080;font-size:12px;text-align:center;margin:0;">Код действителен в течение 10 минут.</p>
  <p style="color:#607080;font-size:12px;text-align:center;margin:8px 0 0;">Если вы не запрашивали код, просто удалите это письмо.</p>
</div>
</body>
</html>`,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`[EmailOTP] ✅ Sent to ${to} (id=${data.id})`);
      return true;
    }
    console.error(`[EmailOTP] Resend error:`, data);
    return false;
  } catch (err) {
    console.error(`[EmailOTP] Send failed:`, err);
    return false;
  }
}

function otpTemplate(otp: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#060e1a;font-family:Arial,sans-serif;">
<div style="max-width:400px;margin:40px auto;padding:32px;background:#0d1a28;border-radius:16px;border:1px solid #1a2e42;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="width:64px;height:64px;margin:0 auto;background:linear-gradient(135deg,#1d4ed8,#2563eb);border-radius:16px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:28px;">🔐</span>
    </div>
  </div>
  <h1 style="color:#fff;font-size:22px;font-weight:900;text-align:center;margin:0 0 8px;">Ваш код верификации</h1>
  <p style="color:#607080;font-size:14px;text-align:center;margin:0 0 24px;">Используйте этот код для входа в Ovora Cargo</p>
  <div style="background:#1a2a3a;padding:20px;border-radius:12px;text-align:center;margin:0 0 24px;">
    <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#5ba3f5;font-family:monospace;">${otp}</span>
  </div>
  <p style="color:#607080;font-size:12px;text-align:center;margin:0;">Код действителен 10 минут.</p>
</div></body></html>`;
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
      if (ageMs < 60_000) {
        return c.json({ success: true, rateLimited: true, cooldownRemaining: Math.ceil((60_000 - ageMs) / 1000) });
      }
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    await kv.set(`ovora:email_otp:${normalizedEmail}`, { otpHash, expiresAt, attempts: 0, createdAt: new Date().toISOString() });
    await kv.set(rlKey, { sentAt: new Date().toISOString() });

    const emailSent = await sendEmail(normalizedEmail, otp);

    return c.json({
      success: true,
      expiresIn: OTP_TTL_MS / 1000,
      emailSent,
      ...(emailSent ? {} : { otp }),
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
    if (!stored) return c.json({ success: false, error: "OTP не найден. Запросите новый код." });
    if (new Date(stored.expiresAt) < new Date()) { await kv.del(kvKey); return c.json({ success: false, error: "OTP истёк." }); }
    if (stored.attempts >= 5) { await kv.del(kvKey); return c.json({ success: false, error: "Превышен лимит попыток." }); }

    const inputHash = await hashOtp(token.replace(/\s/g, ""));
    if (inputHash !== stored.otpHash) {
      await kv.set(kvKey, { ...stored, attempts: stored.attempts + 1 });
      return c.json({ success: false, error: `Неверный код. Осталось: ${5 - stored.attempts - 1}` });
    }
    await kv.del(kvKey);

    const users: any[] = (await kv.get("ovora:users")) || [];
    const existingUser = users.find(u => u.email?.toLowerCase() === normalizedEmail);

    return c.json({ success: true, user: existingUser || null, isNew: !existingUser });
  } catch (err) {
    return c.json({ success: false, error: String(err) }, 500);
  }
}

export async function handleRegisterWithOtp(c: Context) {
  try {
    const body = await c.req.json();
    const { email, role, firstName, lastName, phone } = body;
    if (!email || !role || !firstName || !lastName) return c.json({ error: "Missing fields" }, 400);

    const normalizedEmail = email.toLowerCase().trim();
    const users: any[] = (await kv.get("ovora:users")) || [];
    if (users.find(u => u.email?.toLowerCase() === normalizedEmail)) return c.json({ error: "User exists" }, 400);

    const newUser = { id: crypto.randomUUID(), email: normalizedEmail, role, firstName: firstName.trim(), lastName: lastName.trim(), phone: phone?.trim() || "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    users.push(newUser);
    await kv.set("ovora:users", users);

    return c.json({ success: true, user: newUser });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
}
