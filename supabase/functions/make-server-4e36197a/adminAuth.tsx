// adminAuth.tsx — RBAC для админ-эндпоинтов, вынесено из index.ts для юнит-тестов.
// Authorization всегда содержит anon key (требование Supabase gateway), поэтому
// его нельзя использовать для передачи admin JWT. Роль передаётся через
// X-Admin-Code (legacy plaintext, всегда super-admin) или X-Admin-Token
// (новый JWT с ролью внутри, см. POST /admin/auth) — выдаётся отдельным
// заголовком, чтобы не конфликтовать с anon-key в Authorization.
// 'super-admin' проходит любую requireRole-проверку; 'cargo-admin'/'avia-admin'
// ограничены своей платформой.
import { jwtVerify } from "npm:jose";

export type AdminRole = 'super-admin' | 'cargo-admin' | 'avia-admin';

// Проверка отзыва JWT (logout-all при компрометации) — внедряется снаружи (index.ts
// читает метку времени из KV), чтобы adminAuth.tsx оставался юнит-тестируемым без
// реального хранилища: по умолчанию (без аргумента) проверка просто не выполняется.
export type RevocationCheck = (issuedAtSec: number) => Promise<boolean>;

export async function resolveAdminRole(c: any, isRevoked?: RevocationCheck): Promise<AdminRole | null> {
  // ── Primary: X-Admin-Code plaintext — всегда super-admin (backward-compat) ──
  const adminCode = (c.req.header('X-Admin-Code') || '').trim();
  if (adminCode) {
    const envCode = (Deno.env.get('ADMIN_ACCESS_CODE') || '').trim();
    if (!envCode) {
      console.error('[requireAdmin] ADMIN_ACCESS_CODE not configured in environment');
      return null;
    }
    return adminCode === envCode ? 'super-admin' : null;
  }

  // ── Role-scoped JWT (X-Admin-Token) — выдаётся /admin/auth ─────────────────
  const adminToken = (c.req.header('X-Admin-Token') || '').trim();
  if (adminToken) {
    const jwtSecret = (Deno.env.get('ADMIN_JWT_SECRET') || '').trim();
    if (jwtSecret) {
      try {
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(adminToken, secret);
        if (isRevoked && typeof payload.iat === 'number' && await isRevoked(payload.iat)) {
          console.warn('[requireAdmin] Admin JWT revoked (issued before logout-all)');
          return null;
        }
        return (payload.role as AdminRole) || 'super-admin';
      } catch (err) {
        console.warn('[requireAdmin] Invalid/expired admin JWT:', err);
      }
    }
  }

  return null;
}

export async function requireAdmin(c: any, next: any, isRevoked?: RevocationCheck) {
  const role = await resolveAdminRole(c, isRevoked);
  if (!role) {
    console.warn('[requireAdmin] No valid admin credentials for:', c.req.path);
    return c.json({ error: 'Unauthorized: Admin access required' }, 401);
  }
  console.log(`[requireAdmin] Access granted (role=${role}) for:`, c.req.path);
  c.set('adminRole', role);
  return await next();
}

// ── Role gate — применяется ПОСЛЕ requireAdmin. super-admin проходит всегда,
// остальные роли — только если входят в allowed.
export function requireRole(allowed: AdminRole[]) {
  return async (c: any, next: any) => {
    const role = c.get('adminRole') as AdminRole | undefined;
    if (role === 'super-admin' || (role && allowed.includes(role))) {
      return await next();
    }
    console.warn(`[requireRole] Forbidden: role=${role} not in [${allowed.join(', ')}] for`, c.req.path);
    return c.json({ error: 'Forbidden: insufficient admin role' }, 403);
  };
}

// ── Non-blocking admin check — для эндпоинтов с двойным режимом
// (владелец ресурса ИЛИ админ-оверрайд), где requireAdmin как middleware
// не подходит, потому что обычные пользователи тоже должны иметь доступ.
// Проверяет и X-Admin-Code, и X-Admin-Token, как requireAdmin.
export async function isAdminCaller(c: any, isRevoked?: RevocationCheck): Promise<boolean> {
  return (await resolveAdminRole(c, isRevoked)) !== null;
}
