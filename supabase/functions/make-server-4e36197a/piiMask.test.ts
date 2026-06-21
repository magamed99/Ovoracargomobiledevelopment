import { describe, it, expect } from 'vitest';
import { maskEmail, maskPhone } from './piiMask.tsx';

describe('maskEmail', () => {
  it('маскирует локальную часть, оставляя домен видимым', () => {
    expect(maskEmail('saburovmuhamadjon@gmail.com')).toBe('sa***************@gmail.com');
  });

  it('обрабатывает короткую локальную часть', () => {
    expect(maskEmail('a@b.com')).toBe('a*@b.com');
  });

  it('обрабатывает null/undefined без исключений', () => {
    expect(maskEmail(null)).toBe('');
    expect(maskEmail(undefined)).toBe('');
  });

  it('возвращает *** для строки без @', () => {
    expect(maskEmail('not-an-email')).toBe('***');
  });
});

describe('maskPhone', () => {
  it('оставляет видимыми последние 4 цифры', () => {
    expect(maskPhone('+992123456789')).toBe('+***6789');
  });

  it('обрабатывает null/undefined без исключений', () => {
    expect(maskPhone(null)).toBe('');
    expect(maskPhone(undefined)).toBe('');
  });

  it('возвращает *** для слишком короткого номера', () => {
    expect(maskPhone('12')).toBe('***');
  });
});
