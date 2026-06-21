import { describe, it, expect } from 'vitest';
import { calculateAverageRating } from './rating.tsx';

describe('calculateAverageRating', () => {
  it('возвращает 0 для пустого списка отзывов', () => {
    expect(calculateAverageRating([])).toBe(0);
  });

  it('считает среднее и округляет до 1 знака', () => {
    expect(calculateAverageRating([5, 4, 5])).toBeCloseTo(4.7, 5);
  });

  it('возвращает точное целое значение для одного отзыва', () => {
    expect(calculateAverageRating([3])).toBe(3);
  });

  it('игнорирует невалидные (NaN/нечисловые) значения как 0', () => {
    expect(calculateAverageRating([5, NaN, 5])).toBeCloseTo(3.3, 5);
  });

  it('корректно округляет границу .x5 вверх', () => {
    expect(calculateAverageRating([4, 5])).toBe(4.5);
  });
});
