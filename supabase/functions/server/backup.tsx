// ══════════════════════════════════════════════════════════════════════════════
//  BACKUP RECOVERY CODE SYSTEM
//
//  Security model:
//  • Raw code: 32 crypto-random bytes → 64 hex chars (256-bit entropy)
//  • Stored:   SHA-256(rawCode) ONLY — KV never contains the real code
//  • Shown:    Raw code displayed in UI exactly ONCE, then discarded
//  • Verify:   SHA-256(input) === stored hash (constant-time safe via string compare)
//  • Email:    Security notification via Resend (no code in email — only UI shows it)
// ══════════════════════════════════════════════════════════════════════════════

import type { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

// ── Crypto helpers ────────────────────────────────────────────────────────────

/**
 * Generate a 256-bit cryptographically secure random code.
 * Returns 64 lowercase hex characters.
 */
function generateRawCode(): string {
  const buf = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compute SHA-256 hash of a string.
 * Returns hex string.
 */
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Normalize code: strip all non-hex chars and lowercase.
 * Allows user to paste code with dashes/spaces from the formatted display.
 */
function normalizeCode(raw: string): string {
  return raw.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
}

// ── Email notification (via Resend) ──────────────────────────────────────────

async function sendBackupCreatedEmail(toEmail: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("[Backup] ⚠️ RESEND_API_KEY not set — skipping email");
    return;
  }

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#f8fafc;">
      <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;background:#1978e5;border-radius:12px;padding:10px 18px;">
            <span style="color:white;font-size:18px;font-weight:800;letter-spacing:1px;">Ovora Cargo</span>
          </div>
        </div>

        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:#fef3c7;border-radius:50%;margin-bottom:12px;">
            <span style="font-size:32px;">🔐</span>
          </div>
          <h2 style="color:#0f172a;font-size:20px;font-weight:700;margin:0 0 8px;">
            Резервный код сгенерирован
          </h2>
          <p style="color:#64748b;font-size:14px;margin:0;">
            Для вашего аккаунта <strong>${toEmail}</strong> был создан<br>
            криптографический резервный код восстановления.
          </p>
        </div>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="color:#166534;font-size:13px;margin:0;line-height:1.6;">
            ✅ <strong>Код сохранён безопасно</strong> — в базе данных хранится только
            криптографический хеш SHA-256. Никто, включая разработчиков,
            не может узнать ваш резервный код.
          </p>
        </div>

        <div style="background:#fef9c3;border:1px solid #fde047;border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="color:#713f12;font-size:13px;margin:0;line-height:1.6;">
            ⚠️ <strong>Важно:</strong> Код был показан вам в приложении единственный раз.
            Если вы не сохранили его — создайте новый код через настройки аккаунта.
          </p>
        </div>

        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="color:#991b1b;font-size:13px;margin:0;line-height:1.6;">
            🚨 <strong>Не вы создали этот код?</strong> Немедленно смените пароль
            и обратитесь в поддержку Ovora Cargo.
          </p>
        </div>

        <p style="color:#94a3b8;font-size:11px;text-align:center;margin:0;">
          Это автоматическое уведомление безопасности от Ovora Cargo.<br>
          Не отвечайте на это письмо.
        </p>
      </div>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ovora Cargo Security <onboarding@resend.dev>",
        to: [toEmail],
        subject: "🔐 Резервный код восстановления создан — Ovora Cargo",
        html,
        text: `Для вашего аккаунта ${toEmail} был создан резервный код восстановления. В базе хранится только хеш SHA-256. Если вы не делали этого — обратитесь в поддержку.`,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`[Backup] ⚠️ Resend error ${res.status}:`, err);
    } else {
      console.log(`[Backup] ✅ Security email sent to ${toEmail}`);
    }
  } catch (err) {
    console.warn("[Backup] ⚠️ Resend fetch failed:", err);
  }
}

// ── KV key helper ─────────────────────────────────────────────────────────────

function backupKey(email: string) {
  return `ovora:recovery:${email.toLowerCase().trim()}`;
}

// ── Route handlers ────────────────────────────────────────────────────────────

/**
 * POST /auth/backup/generate
 * body: { email: string }
 *
 * Generates a new 256-bit recovery code.
 * Stores SHA-256(code) in KV — the raw code is returned ONCE and never stored.
 * Creates an in-app notification and sends a security email.
 * If a previous code exists, it is REPLACED (old code becomes invalid).
 */
export async function handleGenerateBackup(c: Context) {
  try {
    const body = await c.req.json();
    const { email } = body;
    if (!email) return c.json({ error: "email required" }, 400);

    const normalized = email.toLowerCase().trim();

    // Generate raw code and hash
    const rawCode = generateRawCode();
    const hash = await sha256(rawCode);
    const now = new Date().toISOString();

    // Store ONLY the hash — raw code is never persisted
    await kv.set(backupKey(normalized), {
      hash,
      algorithm: "SHA-256",
      entropy: "256-bit (32 random bytes via crypto.getRandomValues)",
      createdAt: now,
      usedAt: null,
    });

    console.log(`[Backup] 🔐 Recovery code generated for ${normalized} — hash stored, raw discarded after response`);

    // In-app notification
    const notifId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await kv.set(`ovora:notification:${normalized}:${notifId}`, {
      id: notifId,
      userEmail: normalized,
      type: "security",
      iconName: "KeyRound",
      iconBg: "bg-amber-500/10 text-amber-500",
      title: "Резервный код восстановления создан",
      description:
        "256-битный криптографический ключ сгенерирован и защищён SHA-256. Храните его в надёжном месте.",
      isUnread: true,
      createdAt: now,
    });

    // Security email (fire-and-forget — don't block response)
    sendBackupCreatedEmail(normalized).catch((err) =>
      console.warn("[Backup] Email error (non-fatal):", err)
    );

    // Return raw code ONCE — frontend must show it immediately
    return c.json({
      success: true,
      code: rawCode, // 64 hex chars — shown in UI once, then gone
      createdAt: now,
      algorithm: "SHA-256",
      entropy: "256-bit",
    });
  } catch (err) {
    console.log("Error POST /auth/backup/generate:", err);
    return c.json({ error: `Backup generate failed: ${err}` }, 500);
  }
}

/**
 * POST /auth/backup/verify
 * body: { email: string, code: string }
 *
 * Verifies a recovery code against the stored SHA-256 hash.
 * On success: marks code as used (single-use) and returns { success: true }.
 * On failure: returns error (does NOT increment lockout counter — it's a recovery path).
 */
export async function handleVerifyBackup(c: Context) {
  try {
    const body = await c.req.json();
    const { email, code } = body;

    if (!email || !code) {
      return c.json({ success: false, error: "email and code required" }, 400);
    }

    const normalized = email.toLowerCase().trim();
    const stored: any = await kv.get(backupKey(normalized));

    if (!stored) {
      console.log(`[Backup] ❌ No recovery code for ${normalized}`);
      return c.json({
        success: false,
        error: "Резервный код не найден. Возможно, он ещё не был создан или был сброшен.",
      });
    }

    if (stored.usedAt) {
      console.log(`[Backup] ❌ Code already used for ${normalized} at ${stored.usedAt}`);
      return c.json({
        success: false,
        error: "Этот резервный код уже был использован. Создайте новый в настройках.",
      });
    }

    // Normalize input: strip dashes/spaces, lowercase
    const cleanInput = normalizeCode(code);
    if (cleanInput.length !== 64) {
      return c.json({
        success: false,
        error: "Неверный формат кода. Ожидается 64 hex-символа.",
      });
    }

    // Hash the input and compare
    const inputHash = await sha256(cleanInput);
    if (inputHash !== stored.hash) {
      console.log(`[Backup] ❌ Wrong code for ${normalized}`);
      return c.json({
        success: false,
        error: "Неверный резервный код. Проверьте, что ввели код без ошибок.",
      });
    }

    // ✅ Valid — mark as used (one-time use)
    await kv.set(backupKey(normalized), {
      ...stored,
      usedAt: new Date().toISOString(),
    });

    console.log(`[Backup] ✅ Recovery code verified for ${normalized}`);

    // Notification: recovery used
    const notifId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await kv.set(`ovora:notification:${normalized}:${notifId}`, {
      id: notifId,
      userEmail: normalized,
      type: "security",
      iconName: "ShieldCheck",
      iconBg: "bg-emerald-500/10 text-emerald-500",
      title: "Резервный код использован",
      description: "Вход выполнен через резервный код. Рекомендуем создать новый код в настройках.",
      isUnread: true,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, message: "Резервный код подтверждён" });
  } catch (err) {
    console.log("Error POST /auth/backup/verify:", err);
    return c.json({ error: `Backup verify failed: ${err}` }, 500);
  }
}

/**
 * GET /auth/backup/exists/:email
 *
 * Returns whether a backup code exists for the email (without revealing the hash).
 */
export async function handleBackupExists(c: Context) {
  try {
    const email = decodeURIComponent(c.req.param("email"));
    const stored: any = await kv.get(backupKey(email));

    if (!stored) {
      return c.json({ exists: false });
    }

    return c.json({
      exists: true,
      createdAt: stored.createdAt,
      isUsed: !!stored.usedAt,
      usedAt: stored.usedAt || null,
      algorithm: stored.algorithm,
    });
  } catch (err) {
    console.log("Error GET /auth/backup/exists:", err);
    return c.json({ error: `${err}` }, 500);
  }
}
