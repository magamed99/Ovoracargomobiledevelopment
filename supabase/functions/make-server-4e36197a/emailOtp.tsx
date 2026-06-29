// ══════════════════════════════════════════════════════════════════════════════
//  EMAIL OTP — Supabase Auth (бесплатно 50,000 MAU)
//  Используем Supabase Auth для отправки OTP на email
// ══════════════════════════════════════════════════════════════════════════════

import type { Context } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * POST /auth/send-email-otp
 * Отправка OTP на email через Supabase Auth
 */
export async function handleSendEmailOtp(c: Context) {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return c.json({ success: false, error: "Valid email is required" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getSupabaseClient();

    // Используем Supabase Auth для отправки OTP
    const { data, error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        // Настройки для нашего приложения
        data: {
          app_name: "Ovora Cargo",
        }
      }
    });

    if (error) {
      console.error("[EmailOTP] Supabase error:", error.message);
      return c.json({ success: false, error: error.message });
    }

    console.log(`[EmailOTP] ✅ OTP sent to ${normalizedEmail}`);

    return c.json({
      success: true,
      message: "OTP sent to email",
      // Supabase Auth сам отправляет письмо с кодом
    });
  } catch (err) {
    console.error("Error POST /auth/send-email-otp:", err);
    return c.json({ success: false, error: `Send OTP failed: ${err}` }, 500);
  }
}

/**
 * POST /auth/verify-email-otp
 * Верификация OTP кода через Supabase Auth
 */
export async function handleVerifyEmailOtp(c: Context) {
  try {
    const body = await c.req.json();
    const { email, token } = body;

    if (!email || !token) {
      return c.json({ success: false, error: "Email and token are required" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getSupabaseClient();

    // Верифицируем OTP через Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: token.trim(),
      type: 'email'
    });

    if (error) {
      console.error("[EmailOTP] Verify error:", error.message);
      return c.json({ success: false, error: error.message });
    }

    if (!data?.user) {
      return c.json({ success: false, error: "User not found after verification" });
    }

    console.log(`[EmailOTP] ✅ Verified: ${normalizedEmail}`);

    // Проверяем, есть ли пользователь в нашей базе
    const usersKey = "ovora:users";
    const kv = await import("./kv_store.tsx");
    const users: any[] = (await kv.get(usersKey)) || [];
    const existingUser = users.find(u => u.email?.toLowerCase() === normalizedEmail);

    return c.json({
      success: true,
      user: existingUser || null,
      isNew: !existingUser,
      supabaseUser: {
        id: data.user.id,
        email: data.user.email,
      }
    });
  } catch (err) {
    console.error("Error POST /auth/verify-email-otp:", err);
    return c.json({ success: false, error: `Verify OTP failed: ${err}` }, 500);
  }
}

/**
 * POST /auth/register-with-otp
 * Регистрация нового пользователя после OTP верификации
 */
export async function handleRegisterWithOtp(c: Context) {
  try {
    const body = await c.req.json();
    const { email, role, firstName, lastName, phone, supabaseUserId } = body;

    if (!email || !role || !firstName || !lastName) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const kv = await import("./kv_store.tsx");

    // Проверяем, существует ли пользователь
    const usersKey = "ovora:users";
    const users: any[] = (await kv.get(usersKey)) || [];
    const existingUser = users.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }

    // Создаём нового пользователя
    const newUser = {
      id: supabaseUserId || crypto.randomUUID(),
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
