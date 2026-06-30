// CIS Phone Validation - works without external dependencies

const CIS: Record<string, { name: string; flag: string; prefixes: string[]; len: number }> = {
  'TJ': { name: 'Таджикистан', flag: '🇹🇯', prefixes: ['90','91','93','98','99'], len: 9 },
  'RU': { name: 'Россия', flag: '🇷🇺', prefixes: ['9','3','4','8'], len: 10 },
  'KZ': { name: 'Казахстан', flag: '🇰🇿', prefixes: ['7'], len: 10 },
  'UZ': { name: 'Узбекистан', flag: '🇺🇿', prefixes: ['9','3'], len: 9 },
  'KG': { name: 'Кыргызстан', flag: '🇰🇬', prefixes: ['5','7'], len: 9 },
  'AM': { name: 'Армения', flag: '🇦🇲', prefixes: ['4','5','6','7','9'], len: 8 },
  'AZ': { name: 'Азербайджан', flag: '🇦🇿', prefixes: ['10','50','51','70','77'], len: 9 },
  'BY': { name: 'Беларусь', flag: '🇧🇾', prefixes: ['25','29','33'], len: 9 },
  'MD': { name: 'Молдова', flag: '🇲🇩', prefixes: ['6','7'], len: 8 },
  'GE': { name: 'Грузия', flag: '🇬🇪', prefixes: ['5','7'], len: 9 },
};

export interface PhoneValidationResult {
  valid: boolean;
  country?: string;
  countryName?: string;
  countryFlag?: string;
  error?: string;
}

function detectAndValidate(raw: string): { code: string; local: string } | null {
  const d = raw.replace(/[^\d]/g, '');
  
  // With country code
  if (d.startsWith('992') && d.length >= 12) return { code: 'TJ', local: d.slice(3, 12) };
  if (d.startsWith('7') && d.length === 11) {
    return d[1] === '7' ? { code: 'KZ', local: d.slice(1) } : { code: 'RU', local: d.slice(1) };
  }
  if (d.startsWith('998') && d.length >= 12) return { code: 'UZ', local: d.slice(3, 12) };
  if (d.startsWith('996') && d.length >= 12) return { code: 'KG', local: d.slice(3, 12) };
  if (d.startsWith('374') && d.length >= 11) return { code: 'AM', local: d.slice(3, 11) };
  if (d.startsWith('994') && d.length >= 12) return { code: 'AZ', local: d.slice(3, 12) };
  if (d.startsWith('375') && d.length >= 12) return { code: 'BY', local: d.slice(3, 12) };
  if (d.startsWith('373') && d.length >= 11) return { code: 'MD', local: d.slice(3, 11) };
  if (d.startsWith('995') && d.length >= 12) return { code: 'GE', local: d.slice(3, 12) };

  // Without + but with code
  if (d.startsWith('992') && d.length === 12) return { code: 'TJ', local: d.slice(3) };
  if (d.startsWith('998') && d.length === 12) return { code: 'UZ', local: d.slice(3) };
  if (d.startsWith('996') && d.length === 12) return { code: 'KG', local: d.slice(3) };

  return null;
}

export function validateCisPhone(phone: string): PhoneValidationResult {
  if (!phone || phone.trim().length < 3) {
    return { valid: false, error: 'Введите номер телефона' };
  }

  const detected = detectAndValidate(phone);
  if (!detected) {
    return { valid: false, error: 'Формат: +992 900 123 456' };
  }

  const info = CIS[detected.code];
  if (!info) return { valid: false, error: 'Страна не поддерживается' };

  if (detected.local.length !== info.len) {
    return { valid: false, country: detected.code, error: 'Неверная длина' };
  }

  if (!/^\d+$/.test(detected.local)) {
    return { valid: false, country: detected.code, error: 'Только цифры' };
  }

  const prefix = detected.local.slice(0, 2);
  const ok = info.prefixes.some(p => prefix.startsWith(p));
  if (!ok) {
    return { valid: false, country: detected.code, error: 'Неизвестный оператор' };
  }

  return { valid: true, country: detected.code, countryName: info.name, countryFlag: info.flag };
}

export function getCisCountryName(code: string): string {
  return CIS[code]?.name || code;
}

export function getCisCountryFlag(code: string): string {
  return CIS[code]?.flag || '🏳️';
}
