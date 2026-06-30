// CIS Phone Validation with country selector support

const CIS: Record<string, { name: string; flag: string; code: string; prefixes: string[]; len: number }> = {
  'TJ': { name: 'Таджикистан', flag: '🇹🇯', code: '+992', prefixes: ['90','91','93','98','99'], len: 9 },
  'RU': { name: 'Россия', flag: '🇷🇺', code: '+7', prefixes: ['9','3','4','8'], len: 10 },
  'KZ': { name: 'Казахстан', flag: '🇰🇿', code: '+7', prefixes: ['7'], len: 10 },
  'UZ': { name: 'Узбекистан', flag: '🇺🇿', code: '+998', prefixes: ['9','3'], len: 9 },
  'KG': { name: 'Кыргызстан', flag: '🇰🇬', code: '+996', prefixes: ['5','7'], len: 9 },
  'AM': { name: 'Армения', flag: '🇦🇲', code: '+374', prefixes: ['4','5','6','7','9'], len: 8 },
  'AZ': { name: 'Азербайджан', flag: '🇦🇿', code: '+994', prefixes: ['10','50','51','70','77'], len: 9 },
  'BY': { name: 'Беларусь', flag: '🇧🇾', code: '+375', prefixes: ['25','29','33'], len: 9 },
  'MD': { name: 'Молдова', flag: '🇲🇩', code: '+373', prefixes: ['6','7'], len: 8 },
  'GE': { name: 'Грузия', flag: '🇬🇪', code: '+995', prefixes: ['5','7'], len: 9 },
};

export const CIS_LIST = Object.entries(CIS).map(([key, val]) => ({ code: key, ...val }));

export interface PhoneValidationResult {
  valid: boolean;
  country?: string;
  countryName?: string;
  countryFlag?: string;
  countryCode?: string;
  error?: string;
}

// Validate local number with known country
export function validateLocalPhone(countryCode: string, localNumber: string): PhoneValidationResult {
  const info = CIS[countryCode];
  if (!info) return { valid: false, error: 'Страна не поддерживается' };

  const cleaned = localNumber.replace(/[^\d]/g, '');
  if (cleaned.length === 0) return { valid: false, country: countryCode, error: 'Введите номер' };
  if (cleaned.length !== info.len) return { valid: false, country: countryCode, error: 'Нужно ' + info.len + ' цифр' };

  const prefix = cleaned.slice(0, 2);
  const ok = info.prefixes.some(p => prefix.startsWith(p));
  if (!ok) return { valid: false, country: countryCode, error: 'Неизвестный оператор' };

  return { valid: true, country: countryCode, countryName: info.name, countryFlag: info.flag, countryCode: info.code };
}

// Validate full phone with country code (legacy support)
export function validateCisPhone(phone: string): PhoneValidationResult {
  if (!phone || phone.trim().length < 3) {
    return { valid: false, error: 'Введите номер телефона' };
  }

  const d = phone.replace(/[^\d]/g, '');

  // Detect country from full number
  let country: string | null = null;
  let local = '';

  if (d.startsWith('992') && d.length >= 12) { country = 'TJ'; local = d.slice(3, 12); }
  else if (d.startsWith('7') && d.length === 11) { country = d[1] === '7' ? 'KZ' : 'RU'; local = d.slice(1); }
  else if (d.startsWith('998') && d.length >= 12) { country = 'UZ'; local = d.slice(3, 12); }
  else if (d.startsWith('996') && d.length >= 12) { country = 'KG'; local = d.slice(3, 12); }
  else if (d.startsWith('374') && d.length >= 11) { country = 'AM'; local = d.slice(3, 11); }
  else if (d.startsWith('994') && d.length >= 12) { country = 'AZ'; local = d.slice(3, 12); }
  else if (d.startsWith('375') && d.length >= 12) { country = 'BY'; local = d.slice(3, 12); }
  else if (d.startsWith('373') && d.length >= 11) { country = 'MD'; local = d.slice(3, 11); }
  else if (d.startsWith('995') && d.length >= 12) { country = 'GE'; local = d.slice(3, 12); }

  if (!country) return { valid: false, error: 'Формат: +992 900 123 456' };
  return validateLocalPhone(country, local);
}

export function getCisCountryName(code: string): string {
  return CIS[code]?.name || code;
}

export function getCisCountryFlag(code: string): string {
  return CIS[code]?.flag || '🏳️';
}

export function getCisCountryCode(code: string): string {
  return CIS[code]?.code || '+?';
}
