import type { Context } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key);
}

const OTP_TTL_MS = 10 * 60 * 1000;

export async function handleSendEmailOtp(c: Context) {
  try {
    const { email } = await c.req.json();
    if (!email?.includes("@")) return c.json({ success: false, error: "Valid email required" }, 400);

    const e = email.toLowerCase().trim();

    // Rate limit 60s
    const rlKey = `ovora:otp:rl:${e}`;
    const last: any = await kv.get(rlKey);
    if (last?.ts && Date.now() - last.ts < 60_000) {
      return c.json({ success: true, rateLimited: true, cooldownRemaining: Math.ceil((60_000 - (Date.now() - last.ts)) / 1000) });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithOtp({ email: e });

    if (error) {
      console.error("[OTP] Supabase error:", JSON.stringify(error));
      return c.json({ success: false, error: error.message || JSON.stringify(error) });
    }

    await kv.set(rlKey, { ts: Date.now() });
    console.log(`[OTP] ✅ Sent to ${e}`, JSON.stringify(data));

    return c.json({ success: true, expiresIn: OTP_TTL_MS / 1000 });
  } catch (err) {
    console.error("[OTP] Catch error:", err);
    return c.json({ success: false, error: err?.message || String(err) }, 500);
  }
}

export async function handleVerifyEmailOtp(c: Context) {
  try {
    const { email, token } = await c.req.json();
    if (!email || !token) return c.json({ success: false, error: "Email and token required" }, 400);

    const e = email.toLowerCase().trim();
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.verifyOtp({ email: e, token: token.trim(), type: "email" });

    if (error) {
      console.error("[OTP] Verify error:", JSON.stringify(error));
      return c.json({ success: false, error: error.message || JSON.stringify(error) });
    }

    const users: any[] = (await kv.get("ovora:users")) || [];
    const existing = users.find(u => u.email?.toLowerCase() === e);

    return c.json({ success: true, user: existing || null, isNew: !existing });
  } catch (err) {
    return c.json({ success: false, error: err?.message || String(err) }, 500);
  }
}

export async function handleRegisterWithOtp(c: Context) {
  try {
    const { email, role, firstName, lastName, phone } = await c.req.json();
    if (!email || !role || !firstName || !lastName) return c.json({ error: "Missing fields" }, 400);

    const e = email.toLowerCase().trim();
    const users: any[] = (await kv.get("ovora:users")) || [];
    if (users.find(u => u.email?.toLowerCase() === e)) return c.json({ error: "User exists" }, 400);

    const user = { id: crypto.randomUUID(), email: e, role, firstName: firstName.trim(), lastName: lastName.trim(), phone: phone?.trim() || "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    users.push(user);
    await kv.set("ovora:users", users);

    return c.json({ success: true, user });
  } catch (err) {
    return c.json({ error: err?.message || String(err) }, 500);
  }
}
