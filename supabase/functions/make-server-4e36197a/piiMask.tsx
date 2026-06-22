// piiMask.tsx — маскирование PII (email/телефон) для логов.
// Используется там, где debug-логи попадают в стандартный вывод Supabase
// Edge Functions без редакции (см. IMPROVEMENTS.md, пункт 0.5).
export function maskEmail(email: string | null | undefined): string {
  if (!email) return String(email ?? '');
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return String(phone ?? '');
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `${phone.slice(0, phone.length - digits.length)}***${digits.slice(-4)}`;
}
