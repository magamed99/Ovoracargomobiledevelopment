// Phone validation for CIS countries - no external dependencies

const CIS_COUNTRIES: Record<string, { name: string; flag: string; prefixes: string[]; length: number }> = {
  'TJ': { name: 'Таджикистан', flag: '🇹🇯', prefixes: ['90', '91', '93', '98', '99'], length: 9 },
  'RU': { name: 'Россия', flag: '🇷🇺', prefixes: ['9', '3', '4', '8'], length: 10 },
  'KZ': { name: 'Казахстан', flag: '🇰🇿', prefixes: ['7'], length: 10 },
  'UZ': { name: 'Узбекистан', flag: '🇺🇿', prefixes: ['9', '3'], length: 9 },
  'KG': { name: 'Кыргызстан', flag: '🇰🇬', prefixes: ['5', '7'], length: 9 },
  'AM': { name: 'Армения', flag: '🇦🇲', prefixes: ['4', '5', '6', '7', '9'], length: 8 },
  'AZ': { name: 'Азербайджан', flag: '🇦🇿', prefixes: ['10', '50', '51', '70', '77'], length: 9 },
  'BY': { name: 'Беларусь', flag: '🇧🇾', prefixes: ['25', '29', '33'], length: 9 },
  'MD': { name: 'Молдова', flag: '🇲🇩', prefixes: ['6', '7'], length: 8 },
  'GE': { name: 'Грузия', flag: '🇬🇪', prefixes: ['5', '7'], length: 9 },
};

export interface PhoneValidationResult {
  valid: boolean;
  country?: string;
  countryName?: string;
  countryFlag?: string;
  error?: string;
}

function detectCountry(phone: string): { code: string; localNumber: string } | null {
  const cleaned = phone.replace(/\s/g, '');
  
  if (cleaned.startsWith('+992')) return { code: 'TJ', localNumber: cleaned.slice(4) };
  if (cleaned.startsWith('+7') && cleaned.length === 12) {
    // Could be Russia or Kazakhstan
    const local = cleaned.slice(2);
    if (local.startsWith('7')) return { code: 'KZ', localNumber: local };
    return { code: 'RU', localNumber: local };
  }
  if (cleaned.startsWith('+998')) return { code: 'UZ', localNumber: cleaned.slice(4) };
  if (cleaned.startsWith('+996')) return { code: 'KG', localNumber: cleaned.slice(4) };
  if (cleaned.startsWith('+374')) return { code: 'AM', localNumber: cleaned.slice(4) };
  if (cleaned.startsWith('+994')) return { code: 'AZ', localNumber: cleaned.slice(4) };
  if (cleaned.startsWith('+375')) return { code: 'BY', localNumber: cleaned.slice(4) };
  if (cleaned.startsWith('+373')) return { code: 'MD', localNumber: cleaned.slice(4) };
  if (cleaned.startsWith('+995')) return { code: 'GE', localNumber: cleaned.slice(4) };
  
  // Try local format
  if (cleaned.startsWith('992')) return { code: 'TJ', localNumber: cleaned.slice(3) };
  if (cleaned.startsWith('998')) return { code: 'UZ', localNumber: cleaned.slice(3) };
  if (cleaned.startsWith('996')) return { code: 'KG', localNumber: cleaned.slice(3) };
  if (cleaned.startsWith('374')) return { code: 'AM', localNumber: cleaned.slice(3) };
  if (cleaned.startsWith('994')) return { code: 'AZ', localNumber: cleaned.slice(3) };
  if (cleaned.startsWith('375')) return { code: 'BY', localNumber: cleaned.slice(3) };
  if (cleaned.startsWith('373')) return { code: 'MD', localNumber: cleaned.slice(3) };
  if (cleaned.startsWith('995')) return { code: 'GE', localNumber: cleaned.slice(3) };
  
  return null;
}

export function validateCisPhone(phone: string): PhoneValidationResult {
  const cleaned = phone.replace(/[^+\d]/g, '');
  
  if (cleaned.length < 5) {
    return { valid: false, error: 'Введите номер телефона' };
  }

  const detected = detectCountry(cleaned);
  if (!detected) {
    return { valid: false, error: 'Не удалось определить страну' };
  }

  const countryData = CIS_COUNTRIES[detected.code];
  if (!countryData) {
    return { valid: false, error: 'Страна не поддерживается' };
  }

  const localNumber = detected.localNumber;
  
  // Check length
  if (localNumber.length !== countryData.length) {
    return { valid: false, country: detected.code, error: 'Неверная длина номера' };
  }

  // Check if all digits
  if (!/^\d+$/.test(localNumber)) {
    return { valid: false, country: detected.code, error: 'Номер должен содержать только цифры' };
  }

  // Check prefix
  const prefix = localNumber.slice(0, 2);
  const validPrefix = countryData.prefixes.some(p => prefix.startsWith(p));
  if (!validPrefix) {
    return { valid: false, country: detected.code, error: 'Неизвестный префикс оператора' };
  }

  return {
    valid: true,
    country: detected.code,
    countryName: countryData.name,
    countryFlag: countryData.flag,
  };
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, '');
  const detected = detectCountry('+' + cleaned);
  if (!detected) return phone;
  
  const countryData = CIS_COUNTRIES[detected.code];
  const local = detected.localNumber;
  
  // Format based on country
  if (detected.code === 'TJ') {
    return '+992 ' + local.slice(0, 3) + ' ' + local.slice(3, 6) + ' ' + local.slice(6);
  }
  if (detected.code === 'RU' || detected.code === 'KZ') {
    return '+7 ' + local.slice(0, 3) + ' ' + local.slice(3, 6) + ' ' + local.slice(6, 8) + ' ' + local.slice(8);
  }
  return '+' + cleaned;
}
