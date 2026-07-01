# Cloudflare Turnstile — включение капчи на регистрации/логине/OTP

Код уже написан и задеплоен, но **не активен**, пока не заданы два ключа — это специально, чтобы включение прошло без даунтайма (тот же паттерн, что у `ADMIN_JWT_SECRET`/`AVIA_JWT_SECRET`, см. `CLAUDE.md`).

Без ключей: виджет капчи не рендерится, backend пропускает проверку — сайт работает как раньше, просто без защиты от ботов.

---

## Шаг 1 — создать Turnstile-сайт в Cloudflare

Не требует смены DNS (это отдельно от `CLOUDFLARE_DDOS_SETUP.md`) — Turnstile можно включить даже без переноса домена на Cloudflare.

1. Зайти на [dash.cloudflare.com](https://dash.cloudflare.com) (аккаунт можно тот же, что и для DDoS-защиты, или отдельный).
2. В левом меню → **Turnstile** → **Add Site**.
3. Domain: `ovora-cargo.ru` (и `localhost` — для локальной разработки, Cloudflare разрешает добавить несколько доменов).
4. Widget mode: **Managed** (рекомендуется — Cloudflare сам решает, показывать ли пользователю визуальную проверку).
5. После создания Cloudflare покажет два ключа:
   - **Site Key** (публичный, безопасно светить во фронтенде)
   - **Secret Key** (держать в секрете, только на бэкенде)

## Шаг 2 — задать Secret Key на бэкенде (Supabase)

```bash
supabase secrets set TURNSTILE_SECRET_KEY=<ваш secret key>
```

Или через Supabase Dashboard → Project Settings → Edge Functions → Secrets.

## Шаг 3 — задать Site Key на фронтенде

Переменная `VITE_TURNSTILE_SITE_KEY` — задаётся при сборке (build-time), как уже сделано с `VITE_SENTRY_DSN` в `.github/workflows/deploy-pages.yml`.

Site key **не секрет** (Cloudflare сам это утверждает в доках) — безопасно хранить в открытом виде в workflow-файле:

```yaml
      - name: Build
        run: npm run build
        env:
          VITE_SENTRY_DSN: https://...
          VITE_TURNSTILE_SITE_KEY: <ваш site key>
```

## Шаг 4 — деплой

После того как оба ключа заданы, следующий деплой (frontend через GitHub Pages + backend через Supabase Edge Function) включит капчу автоматически — без изменений кода.

## Где капча появится

- Регистрация email (`EmailAuth.tsx`) — на шаге ввода email, повторной отправки кода и финального создания аккаунта
- Регистрация AVIA (`avia/AviaAuth.tsx`) — на шаге выбора роли перед созданием аккаунта
- Форма `SenderRegistrationForm.tsx` (легаси-маршрут `/sender-registration-form`)
- Вход в админ-панель (`AdminAuthGate.tsx`)

Обычный логин (email/phone/AVIA) капчой **не защищён** — там уже стоит rate-limit (15 попыток / 5 минут), капча добавила бы трение без большой пользы. Если понадобится — добавляется тем же паттерном (см. `turnstile.tsx`).

## Проверка после включения

1. Открыть `/email-auth` — должен появиться виджет капчи перед кнопкой "Получить код".
2. Если виджет не появился — проверить, что `VITE_TURNSTILE_SITE_KEY` реально попал в собранный бандл (можно посмотреть в devtools → Network → искать `challenges.cloudflare.com`).
3. Если виджет есть, но регистрация всё равно проходит без него — проверить, что `TURNSTILE_SECRET_KEY` реально задан в Supabase Secrets (`supabase secrets list`).
