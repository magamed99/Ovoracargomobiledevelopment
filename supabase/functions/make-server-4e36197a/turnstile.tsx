// turnstile.tsx — Cloudflare Turnstile (капча) для защиты регистрации/логина/OTP
// от бот-флуда и лёгкого DDoS через дорогие эндпоинты (email, SMS, OCR).
//
// Без TURNSTILE_SECRET_KEY в Supabase Secrets проверка молча пропускается —
// тот же паттерн, что у ADMIN_JWT_SECRET/AVIA_JWT_SECRET (см. CLAUDE.md):
// фича включается только когда оба конца (frontend sitekey + backend secret)
// настроены, чтобы не было даунтайма при постепенном включении.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string | undefined | null, remoteIp?: string): Promise<boolean> {
  const secret = (Deno.env.get('TURNSTILE_SECRET_KEY') || '').trim();
  if (!secret) return true; // capcha не настроена — пропускаем (legacy-режим)
  if (!token) return false; // капча настроена, но клиент не прислал токен

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await res.json();
    return data?.success === true;
  } catch (err) {
    console.warn('[Turnstile] Verification request failed:', err);
    return false;
  }
}

/** Hono middleware — блокирует запрос, если капча настроена и не пройдена. */
export async function requireTurnstile(c: any, next: any) {
  const body = await c.req.json().catch(() => ({}));
  const token = body?.turnstileToken;
  const ip = c.req.header('x-forwarded-for') || undefined;

  const ok = await verifyTurnstile(token, ip);
  if (!ok) {
    console.warn(`[Turnstile] BLOCKED ${c.req.path} | ip=${ip}`);
    return c.json({ error: 'Проверка на бота не пройдена. Обновите страницу и попробуйте снова.' }, 403);
  }

  // Тело уже прочитано выше — кладём его в контекст, чтобы обработчик
  // не пытался читать поток запроса повторно (у Hono/Deno он одноразовый).
  c.set('parsedBody', body);
  return await next();
}
