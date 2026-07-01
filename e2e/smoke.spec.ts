import { test, expect } from '@playwright/test';

// Смоук-тесты, закрепляющие конкретные регрессии, найденные и исправленные
// в ручном баг-тесте (PR #114/#115/#116). Никаких мутирующих запросов к
// реальному бэкенду — OTP-эндпоинты замоканы через page.route(), остальные
// вызовы (GET /trips, /health и т.п.) безопасны как обычный анонимный трафик.
//
// Пути без ведущего слэша: baseURL уже включает базовый путь деплоя
// (/Ovoracargomobiledevelopment), а page.goto('/foo') с ведущим слэшем
// в Playwright резолвится от origin, а не от baseURL, и уводит мимо приложения.

test.describe('Welcome — публичная страница', () => {
  test('рендерится без крашей и консольных ошибок', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('./');
    await expect(page.getByRole('button', { name: /Перейти: AVIA/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Перейти: CARGO/i })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('мобильный hero переводится на все 3 языка (регрессия: было зашито в картинку)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');

    // RU по умолчанию
    await expect(page.getByText('Платформа', { exact: true })).toBeVisible();

    // EN
    await page.getByRole('button', { name: 'Язык: EN' }).click();
    await expect(page.getByText('Platform', { exact: true })).toBeVisible();
    await expect(page.getByText('Freight and air delivery')).toBeVisible();
    // "Drivers" встречается дважды на странице (статистика + тег CARGO-карточки) —
    // берём конкретно подпись рядом с числом "3,400+".
    await expect(page.getByText('3,400+').locator('..').getByText('Drivers', { exact: true })).toBeVisible();

    // TJ
    await page.getByRole('button', { name: 'Язык: TJ' }).click();
    await expect(page.getByText('Платформаи', { exact: true })).toBeVisible();
    await expect(page.getByText('3,400+').locator('..').getByText('Ронандагон', { exact: true })).toBeVisible();
  });

  test('404 на неизвестном маршруте не крашит, редиректит на главную', async ({ page }) => {
    await page.goto('this-route-does-not-exist');
    await expect(page.getByRole('button', { name: /Перейти: AVIA/i })).toBeVisible();
  });
});

test.describe('Юридические страницы — должны быть публичными (регрессия: требовали логин)', () => {
  test('/terms-of-service открывается без сессии', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('terms-of-service');
    await expect(page.getByRole('heading', { name: 'Условия использования' })).toBeVisible();
  });

  test('/privacy-policy открывается без сессии', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('privacy-policy');
    await expect(page.getByRole('heading', { name: 'Конфиденциальность', exact: true })).toBeVisible();
  });
});

test.describe('EmailAuth — валидация формы', () => {
  test('невалидный email блокирует отправку с понятной ошибкой', async ({ page }) => {
    await page.goto('email-auth');
    await page.getByRole('textbox', { name: 'Email адрес' }).fill('notanemail');
    await page.getByRole('button', { name: 'Получить код верификации' }).click();
    await expect(page.getByText('Некорректный формат email')).toBeVisible();
  });

  test('регистрация требует согласия с условиями (регрессия: чекбокса не было вообще)', async ({ page }) => {
    // Мокаем OTP-эндпоинты — не тратим реальную rate-limit квоту прод-бэкенда
    await page.route('**/auth/send-email-otp', route =>
      route.fulfill({ json: { success: true, emailSent: false, otp: '123456' } }));
    await page.route('**/auth/verify-email-otp', route =>
      route.fulfill({ json: { success: true, user: null, isNew: true } }));

    await page.goto('email-auth');
    await page.getByRole('textbox', { name: 'Email адрес' }).fill('e2e-smoke-test@example.com');
    await page.getByRole('button', { name: 'Получить код верификации' }).click();

    const otpBoxes = page.locator('input[type="text"][maxlength="1"]');
    await expect(otpBoxes.first()).toBeVisible({ timeout: 10_000 });
    // Компонент хранит массив цифр в React-состоянии через замыкание onChange —
    // programmatic .fill() по каждому полю подряд ловит гонку устаревшего
    // значения (стейт ещё не успевает осесть между вызовами). Печатаем как
    // реальный пользователь — через keyboard.type в первое поле, дальше сам
    // компонент переводит фокус между полями (onKeyDown auto-advance).
    await otpBoxes.first().click();
    await page.keyboard.type('123456', { delay: 50 });
    await expect(otpBoxes.nth(5)).toHaveValue('6');

    await page.getByRole('button', { name: 'Верифицировать' }).click();
    await expect(page.getByRole('heading', { name: 'Завершите регистрацию' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('textbox', { name: 'Имя' }).fill('Тест');
    await page.getByRole('textbox', { name: 'Фамилия' }).fill('Тестов');
    await page.getByRole('textbox', { name: 'Номер телефона' }).fill('+992900123456');

    // Без чекбокса — должно заблокировать
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();
    await expect(page.getByText('Нужно согласие с условиями использования')).toBeVisible();
  });
});

test.describe('AVIA — публичная страница', () => {
  test('форма входа рендерится', async ({ page }) => {
    await page.goto('avia');
    await expect(page.getByRole('heading', { name: 'Вход в AVIA' })).toBeVisible();
  });
});
