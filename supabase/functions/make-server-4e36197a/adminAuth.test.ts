import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SignJWT } from 'jose';
import { resolveAdminRole, requireAdmin, requireRole, isAdminCaller } from './adminAuth.tsx';

function makeContext(headers: Record<string, string> = {}) {
  const store = new Map<string, unknown>();
  return {
    req: {
      header: (name: string) => headers[name],
      path: '/make-server-4e36197a/admin/users',
    },
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => store.set(key, value),
    json: (body: unknown, status?: number) => ({ body, status: status ?? 200 }),
  };
}

async function signRoleToken(role: string, secret: string) {
  return await new SignJWT({ role }).setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode(secret));
}

describe('resolveAdminRole', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env.ADMIN_ACCESS_CODE = 'super-secret-code';
    process.env.ADMIN_JWT_SECRET = 'a-very-long-test-secret-key-32-chars-min';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('возвращает super-admin при верном X-Admin-Code', async () => {
    const c = makeContext({ 'X-Admin-Code': 'super-secret-code' });
    expect(await resolveAdminRole(c)).toBe('super-admin');
  });

  it('отказывает при неверном X-Admin-Code', async () => {
    const c = makeContext({ 'X-Admin-Code': 'wrong-code' });
    expect(await resolveAdminRole(c)).toBeNull();
  });

  it('отказывает, если ADMIN_ACCESS_CODE не настроен на сервере', async () => {
    delete process.env.ADMIN_ACCESS_CODE;
    const c = makeContext({ 'X-Admin-Code': 'anything' });
    expect(await resolveAdminRole(c)).toBeNull();
  });

  it('возвращает роль из валидного X-Admin-Token (JWT)', async () => {
    const token = await signRoleToken('cargo-admin', process.env.ADMIN_JWT_SECRET!);
    const c = makeContext({ 'X-Admin-Token': token });
    expect(await resolveAdminRole(c)).toBe('cargo-admin');
  });

  it('отказывает при подписи токена неверным секретом', async () => {
    const token = await signRoleToken('cargo-admin', 'wrong-secret-key-also-32-chars-min!!');
    const c = makeContext({ 'X-Admin-Token': token });
    expect(await resolveAdminRole(c)).toBeNull();
  });

  it('отказывает, если ADMIN_JWT_SECRET не настроен на сервере', async () => {
    delete process.env.ADMIN_JWT_SECRET;
    const token = await signRoleToken('cargo-admin', 'a-very-long-test-secret-key-32-chars-min');
    const c = makeContext({ 'X-Admin-Token': token });
    expect(await resolveAdminRole(c)).toBeNull();
  });

  it('X-Admin-Code имеет приоритет над X-Admin-Token, если присутствуют оба', async () => {
    const token = await signRoleToken('avia-admin', process.env.ADMIN_JWT_SECRET!);
    const c = makeContext({ 'X-Admin-Code': 'super-secret-code', 'X-Admin-Token': token });
    expect(await resolveAdminRole(c)).toBe('super-admin');
  });

  it('возвращает null без заголовков', async () => {
    const c = makeContext();
    expect(await resolveAdminRole(c)).toBeNull();
  });
});

describe('requireAdmin (middleware)', () => {
  beforeEach(() => {
    process.env.ADMIN_ACCESS_CODE = 'super-secret-code';
  });

  it('пропускает дальше и сохраняет роль при валидных кредах', async () => {
    const c = makeContext({ 'X-Admin-Code': 'super-secret-code' });
    let nextCalled = false;
    const result = await requireAdmin(c, async () => { nextCalled = true; return 'ok'; });
    expect(nextCalled).toBe(true);
    expect(result).toBe('ok');
    expect(c.get('adminRole')).toBe('super-admin');
  });

  it('возвращает 401 без валидных кредов и не вызывает next', async () => {
    const c = makeContext();
    let nextCalled = false;
    const result: any = await requireAdmin(c, async () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(result.status).toBe(401);
  });
});

describe('requireRole (gate)', () => {
  it('super-admin проходит любой allowed-список', async () => {
    const c = makeContext();
    c.set('adminRole', 'super-admin');
    let nextCalled = false;
    await requireRole(['cargo-admin'])(c, async () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it('cargo-admin проходит, если в allowed-списке', async () => {
    const c = makeContext();
    c.set('adminRole', 'cargo-admin');
    let nextCalled = false;
    await requireRole(['cargo-admin'])(c, async () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it('avia-admin получает 403 на cargo-only маршруте', async () => {
    const c = makeContext();
    c.set('adminRole', 'avia-admin');
    let nextCalled = false;
    const result: any = await requireRole(['cargo-admin'])(c, async () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(result.status).toBe(403);
  });

  it('без роли — 403', async () => {
    const c = makeContext();
    let nextCalled = false;
    const result: any = await requireRole(['cargo-admin'])(c, async () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(result.status).toBe(403);
  });
});

describe('isAdminCaller', () => {
  beforeEach(() => {
    process.env.ADMIN_ACCESS_CODE = 'super-secret-code';
  });

  it('true для валидного админа', async () => {
    const c = makeContext({ 'X-Admin-Code': 'super-secret-code' });
    expect(await isAdminCaller(c)).toBe(true);
  });

  it('false для обычного пользователя без креденшалов', async () => {
    const c = makeContext();
    expect(await isAdminCaller(c)).toBe(false);
  });
});
