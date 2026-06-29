import type { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} missing`);
  return v;
}

const OTP_TTL_MS = 10 * 60 * 1000;

async function supabasePost(path: string, body: Record<string, any>, apiKey: string): Promise<any> {
  const url = `${getEnv("SUPABASE_URL")}/auth/v1${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": apiKey, "Authorization": `Bearer ${getEnv("SUPABASE_SERVICE_ROLE_KEY")}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: null, raw: text }; }
}

export async function handleSendEmailOtp(c: Context) {
  try {
    const { email } = await c.req.json();
    if (!email?.includes("@")) return c.json({ success: false, error: "Valid email required" }, 400);

    const e = email.toLowerCase().trim();
    const apiKey = getEnv("SUPABASE_ANON_KEY");

    // Rate limit
    const rlKey = `ovora:otp:rl:${e}`;
    const last: any = await kv.get(rlKey);
    if (last?.ts && Date.now() - last.ts < 60_000) {
      return c.json({ success: true, rateLimited: true, cooldownRemaining: Math.ceil((60_000 - (Date.now() - last.ts)) / 1000) });
    }

    // Call Supabase Auth REST API directly
    const result = await supabasePost("/otp", { email: e, type: "email" }, apiKey);

    console.log(`[OTP] Supabase response:`, JSON.stringify(result));

    if (result.status !== 200 || result.data?.error) {
      const errMsg = result.data?.error_description || result.data?.msg || result.data?.error || result.raw || "Unknown error";
      console.error(`[OTP] Error:`, errMsg);
      return c.json({ success: false, error: String(errMsg) });
    }

    await kv.set(rlKey, { ts: Date.now() });
    console.log(`[OTP] ✅ Sent to ${e}`);

    return c.json({ success: true, expiresIn: OTP_TTL_MS / 1000 });
  } catch (err) {
    console.error("[OTP] Catch:", err);
    return c.json({ success: false, error: err?.message || String(err) }, 500);
  }
}

export async function handleVerifyEmailOtp(c: Context) {
  try {
    const { email, token } = await c.req.json();
    if (!email || !token) return c.json({ success: false, error: "Email and token required" }, 400);

    const e = email.toLowerCase().trim();
    const apiKey = getEnv("SUPABASE_ANON_KEY");

    // Verify via Supabase Auth REST API
    const result = await supabasePost("/verify", { email: e, token: token.trim(), type: "email" }, apiKey);

    console.log(`[OTP] Verify response:`, JSON.stringify(result));

    if (result.status !== 200 || result.data?.error) {
      const errMsg = result.data?.error_description || result.data?.msg || result.data?.error || "Invalid code";
      return c.json({ success: false, error: String(errMsg) });
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
