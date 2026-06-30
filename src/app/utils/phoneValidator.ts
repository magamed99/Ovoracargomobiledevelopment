import { parsePhoneNumber } from 'libphonenumber-js';

const CIS_COUNTRIES = ['TJ', 'RU', 'KZ', 'UZ', 'KG', 'AM', 'AZ', 'BY', 'MD', 'GE'];

export interface PhoneValidationResult {
  valid: boolean;
  country?: string;
  countryCode?: string;
  type?: string;
  formatted?: string;
  error?: string;
}

export function validateCisPhone(phone: string): PhoneValidationResult {
  let normalized = phone.trim();
  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('992')) normalized = '+' + normalized;
    else if (normalized.startsWith('7') && normalized.length === 10) normalized = '+7' + normalized;
    else if (normalized.startsWith('998')) normalized = '+' + normalized;
    else if (normalized.startsWith('996')) normalized = '+' + normalized;
    else if (normalized.startsWith('374')) normalized = '+' + normalized;
    else if (normalized.startsWith('994')) normalized = '+' + normalized;
    else if (normalized.startsWith('375')) normalized = '+' + normalized;
    else if (normalized.startsWith('373')) normalized = '+' + normalized;
    else if (normalized.startsWith('995')) normalized = '+' + normalized;
    else normalized = '+992' + normalized;
  }

  try {
    const parsed = parsePhoneNumber(normalized);
    if (!parsed) return { valid: false, error: 'Неверный формат номера' };

    const isValid = parsed.isValid();
    const country = parsed.country;
    const isCis = country ? CIS_COUNTRIES.includes(country) : false;
    const isMobile = parsed.getType() === 'MOBILE';
    const type = parsed.getType();

    if (!isValid) return { valid: false, country, error: 'Неверный формат номера' };
    if (!isCis) return { valid: false, country, error: 'Принимаются только номера СНГ' };
    if (!isMobile) return { valid: false, country, type, error: 'Нужен мобильный номер' };

    return { valid: true, country, countryCode: country, type, formatted: parsed.formatInternational() };
  } catch {
    return { valid: false, error: 'Ошибка обработки номера' };
  }
}

export function getCisCountryName(code: string): string {
  const names: Record<string, string> = {
    'TJ': 'Таджикистан', 'RU': 'Россия', 'KZ': 'Казахстан', 'UZ': 'Узбекистан',
    'KG': 'Кыргызстан', 'AM': 'Армения', 'AZ': 'Азербайджан', 'BY': 'Беларусь',
    'MD': 'Молдова', 'GE': 'Грузия',
  };
  return names[code] || code;
}

export function getCisCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    'TJ': '🇹🇯', 'RU': '🇷🇺', 'KZ': '🇰🇿', 'UZ': '🇺🇿',
    'KG': '🇰🇬', 'AM': '🇦🇲', 'AZ': '🇦🇿', 'BY': '🇧🇾',
    'MD': '🇲🇩', 'GE': '🇬🇪',
  };
  return flags[code] || '🏳️';
}
