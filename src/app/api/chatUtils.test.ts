import { describe, it, expect } from 'vitest';
import { generateEmailHash, generateTripChatId, generatePairChatId } from './chatUtils';

describe('generateEmailHash', () => {
  it('детерминирован для одного и того же email', () => {
    expect(generateEmailHash('a@b.com')).toBe(generateEmailHash('a@b.com'));
  });

  it('даёт разные хэши для разных email', () => {
    expect(generateEmailHash('a@b.com')).not.toBe(generateEmailHash('c@d.com'));
  });
});

describe('generatePairChatId', () => {
  it('не зависит от порядка аргументов (A,B === B,A)', () => {
    const idAB = generatePairChatId('driver@example.com', 'sender@example.com');
    const idBA = generatePairChatId('sender@example.com', 'driver@example.com');
    expect(idAB).toBe(idBA);
  });

  it('даёт разный id для другой пары', () => {
    const id1 = generatePairChatId('driver@example.com', 'sender@example.com');
    const id2 = generatePairChatId('driver@example.com', 'other-sender@example.com');
    expect(id1).not.toBe(id2);
  });

  it('обрабатывает отсутствующий email как "guest"', () => {
    expect(generatePairChatId('', 'sender@example.com')).toBe(generatePairChatId('guest', 'sender@example.com'));
  });
});

describe('generateTripChatId', () => {
  it('включает tripId в результат', () => {
    expect(generateTripChatId('trip123', 'a@b.com')).toContain('trip123');
  });
});
