# CLAUDE.md — Ovora Cargo Mobile

Контекст проекта для Claude Code. Читай этот файл в начале каждой сессии.

---

## Стек и архитектура

| Слой | Технология |
|---|---|
| Frontend | React 18 + TypeScript + Vite 6 + Tailwind CSS v4 |
| Роутинг | React Router v7 |
| Анимации | Framer Motion (`motion/react`) |
| Backend | Supabase Edge Functions (Deno/Hono) |
| База данных | Supabase KV Store (не PostgreSQL!) |
| Хранилище файлов | Supabase Storage |
| Email | SMTP через edge function |
| Push | Web Push API (VAPID) |
| OCR | OCR.space API |
| Карты | Yandex Maps API v3 |

**Это PWA** (Progressive Web App), не нативное мобильное приложение.

---

## Git и деплой

```
origin  → локальный Gitea прокси (для Claude Code flow)
github  → github.com/magamed99/Ovoracargomobiledevelopment (реальный GitHub)
```

**Ветки:**
- `main-deploy` — основная рабочая ветка
- `main` (на GitHub) → GitHub Actions → GitHub Pages → ovora-cargo.ru
- `claude/*` — фича-ветки для PR

**Деплой:**
```bash
# Применить изменения на продакшн:
git push github HEAD:main

# Пушить текущую работу:
git push origin HEAD:main-deploy
git push github HEAD:claude/<branch-name>
```

**Важно:** После `git push` всегда создавай PR на GitHub если его нет (`mcp__github__create_pull_request`).

---

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `src/app/components/Welcome.tsx` | Главная страница — десктоп/мобайл |
| `src/styles/index.css` | CSS Grid Welcome-страницы, анимации |
| `src/app/i18n/translations.ts` | Переводы ru/tj/en (144 ключа) |
| `src/vite-env.d.ts` | TypeScript global declarations |
| `supabase/functions/make-server-4e36197a/index.ts` | Весь backend API (~7300 строк) |
| `supabase/functions/make-server-4e36197a/rateLimit.tsx` | Token bucket rate limiter |
| `supabase/functions/make-server-4e36197a/kv_store.tsx` | KV абстракция |
| `supabase/functions/make-server-4e36197a/email.tsx` | Email шаблоны |
| `netlify.toml` | Netlify конфиг + CSP/HSTS headers |
| `vercel.json` | Vercel конфиг + CSP/HSTS headers |
| `index.html` | CSP meta-тег (fallback для GitHub Pages) |
| `public/manifest.json` | PWA манифест |
| `.github/workflows/deploy-pages.yml` | CI: typecheck → build → deploy |

---

## Welcome-страница — раскладка (десктоп 700px+)

**CSS Grid 3-колонки × 3-строки** (`src/styles/index.css`):
```
[lang selector]  [пусто — hero просвечивает]  [AVIA карточка ]
[Платформа Ovora]                             [CARGO карточка]
[features bar ————————————— partners card         ————————————]
```

Grid области:
- `.ovora-area-lang`   → col 1 / row 1
- `.ovora-area-brand`  → col 1 / row 2 (скрыт на мобиле)
- `.ovora-area-cards`  → col 3 / rows 1-2
- `.ovora-area-bottom` → col 1/-1 / row 3

**Hero-оверлей:** три направленных градиента (left/right/bottom) скрывают грузовик
`OVORA-CARGO` из фоновой картинки чтобы он не просвечивал через левую колонку.

На мобиле: flex column, порядок → cards → lang → bottom.

---

## Backend API — паттерны безопасности

Все эндпоинты: `POST /make-server-4e36197a/<route>`

### Admin middleware + RBAC
```ts
// Legacy plaintext (backward-compat) — всегда роль super-admin:
X-Admin-Code: <plaintext>

// Role-scoped JWT (подписан ADMIN_JWT_SECRET, 8 часов) — отдельный заголовок,
// т.к. Authorization зарезервирован под Supabase anon key:
X-Admin-Token: <jwt>          // payload: { role: 'super-admin' | 'cargo-admin' | 'avia-admin' }
```
- `super-admin` проходит любую `requireRole(...)` проверку (полный доступ).
- `cargo-admin` — доступ только к `/admin/*` (CARGO + общие разделы).
- `avia-admin` — доступ только к `/avia/admin/*`.
- `cargo-admin`/`avia-admin` работают **только** через JWT — `ADMIN_JWT_SECRET` обязателен, иначе `/admin/auth` отказывает в выдаче токена для этих ролей.
- Фронтенд: роль и токен хранятся в `sessionStorage` (`ovora_admin_role`, `ovora_admin_jwt`/`ovora_admin_token`), `AdminLayout.tsx` фильтрует `navGroups` по роли.

### Правила авторизации (применены)
- `callerEmail` **обязателен** везде где есть проверка владельца
- `PUT /auth/user` — нельзя менять: `role`, `status`, `codeHash`, `blocked`, `isVerified`, `passportNumber`, `passportData`
- `GET /chat/:chatId/messages` — `?callerEmail=` обязателен, проверяется в `participants`
- `PUT /cargos/:id` — `callerEmail` должен совпадать с `senderEmail`
- `DELETE /reviews/:id` — `callerEmail` обязателен
- `PUT /offers/:id` — `callerEmail` должен быть `senderEmail` или `driverEmail`

### Rate limits (из `rateLimit.tsx`)
| Эндпоинт | Лимит |
|---|---|
| `/auth/login-email` | 15 req / 5 мин |
| `/auth/login-phone` | 15 req / 5 мин |
| `/auth/register` | 3 req / час |
| `/admin/auth` | 15 req / 5 мин |

### CORS
Разрешены только: `ovora-cargo.ru`, `magamed99.github.io`, `localhost:5173/4173`

---

## Переменные окружения (Supabase Secrets)

| Переменная | Назначение |
|---|---|
| `SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role ключ |
| `ADMIN_ACCESS_CODE` | Пароль для `/admin/auth` → роль `super-admin` |
| `ADMIN_ACCESS_CODE_CARGO` | Пароль для роли `cargo-admin` (опционально, RBAC) |
| `ADMIN_ACCESS_CODE_AVIA` | Пароль для роли `avia-admin` (опционально, RBAC) |
| `ADMIN_JWT_SECRET` | Секрет для подписи JWT токенов (минимум 32 символа) |
| `AVIA_JWT_SECRET` | Секрет для подписи AVIA session-токенов (`X-Avia-Token`, минимум 32 символа) |
| `YANDEX_GEOCODER_API_KEY` | Yandex Geocoder API |
| `OCR_SPACE_API_KEY` | OCR.space для распознавания документов |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (капча) — секрет для проверки токена на бэкенде |

Плюс отдельно **frontend build-time переменная** (не Supabase secret, задаётся в настройках хостинга/CI, как `VITE_SENTRY_DSN`): `VITE_TURNSTILE_SITE_KEY` — публичный сайт-ключ Turnstile.

**Критично:**
- `ADMIN_JWT_SECRET` ещё не добавлен в Supabase Secrets — без него JWT не выдаётся, работает только legacy `X-Admin-Code` (роль `super-admin`). Роли `cargo-admin`/`avia-admin` недоступны, пока не настроены `ADMIN_JWT_SECRET` + соответствующий `ADMIN_ACCESS_CODE_*`.
- `AVIA_JWT_SECRET` ещё не добавлен в Supabase Secrets — без него `verifyAviaActor()` в `aviaAuth.tsx` работает в legacy-режиме (пропускает все проверки без подтверждения личности), т.е. защита от подмены `callerPhone` в AVIA-эндпоинтах **не действует**, пока секрет не настроен.
- `TURNSTILE_SECRET_KEY` ещё не добавлен в Supabase Secrets, `VITE_TURNSTILE_SITE_KEY` — в frontend-окружении. Без обоих `requireTurnstile` (`turnstile.tsx`) молча пропускает проверку (см. `docs/CLOUDFLARE_DDOS_SETUP.md` и `docs/TURNSTILE_SETUP.md` для включения).

---

## Переводы (i18n)

Файл: `src/app/i18n/translations.ts`
Языки: `ru` | `tj` | `en` — **144 ключа**, все три языка полностью покрыты.

Проверка синхронности переводов:
```bash
python3 -c "
import re
with open('src/app/i18n/translations.ts') as f: c = f.read()
def keys(lang):
    m = re.search(rf'{lang}:\s*\{{(.*?)^\s*\}},', c, re.DOTALL|re.MULTILINE)
    return set(re.findall(r'^\s+(\w+)\s*:', m.group(1), re.MULTILINE)) if m else set()
ru,tj,en = keys('ru'),keys('tj'),keys('en')
print(f'RU:{len(ru)} TJ:{len(tj)} EN:{len(en)}')
print('Missing TJ:', sorted(ru-tj))
print('Missing EN:', sorted(ru-en))
"
```

---

## TypeScript

```bash
npm run typecheck   # tsc --noEmit — 0 ошибок
npm run build       # сборка через Vite/esbuild — не делает type-check
```

- `tsconfig.json` создан с `strict: true`
- `typescript`, `@types/react`, `@types/react-dom` установлены в devDependencies
- CI запускает `typecheck` перед build (non-blocking: `|| true`)
- Известный реальный баг исправлен: `TripDetail` — отсутствовал `useNavigate()`

---

## Безопасность — сделано в этой сессии

### Edge Function (все в `index.ts`)
| ID | Уязвимость | Исправление |
|---|---|---|
| C-2 | Privilege escalation `PUT /auth/user` | Whitelist полей, блокировка `role`/`status`/`codeHash` |
| H-1 | IDOR chat messages | Проверка `participants` на всех чат-эндпоинтах |
| H-2 | PII leak в login | Удаляем `codeHash`, `passportNumber`, `passportData` из ответа |
| H-3 | IDOR `PUT /cargos/:id` | Проверка `callerEmail === senderEmail` |
| H-4 | Yandex key публичный | `requireAdmin` на `/config/yandex-key` |
| H-5 | Plaintext admin token | JWT (HS256, 8ч) через `npm:jose` |
| H-7 | `/test-ocr` без auth | `requireAdmin` |
| M-4 | `callerEmail` опциональный | Обязателен в `/offers` и `/reviews` |
| M-5 | `/chats/cleanup-demo` | `requireAdmin` |
| M-6 | `/ocr/scan-document` cost hijack | Проверка `callerEmail` + существование юзера |
| CORS | `origin: "*"` | Allowlist доменов |
| Rate | Нет лимитов на auth | `RL.LOGIN` + `RL.REGISTER` |

### Frontend
| Что | Файл |
|---|---|
| CSP + HSTS + Permissions-Policy | `netlify.toml`, `vercel.json`, `index.html` |
| SPA redirect вынесен из inline | `public/spa-redirect.js` |
| Дублирующий `@import fonts.css` | Удалён из `src/styles/index.css` |
| PWA meta tags | `index.html`, `manifest.json` |

---

## Команды

```bash
npm run dev          # dev сервер
npm run build        # production build → dist/
npm run typecheck    # TypeScript проверка

# Git
git push origin HEAD:main-deploy           # пуш в Gitea
git push github HEAD:main                  # деплой на GitHub Pages
git push github HEAD:claude/<branch>       # пуш фича-ветки
```

---

## Правила для Claude

1. **Коммить после каждого завершённого блока работы** — не накапливать изменения
2. **Пушить в оба remote**: `origin HEAD:main-deploy` + `github HEAD:claude/<branch>`
3. **PR создавать через `mcp__github__create_pull_request`** как draft
4. **Не трогать `role`/`status`/`codeHash` в пользовательских эндпоинтах** — защищены whitelist
5. **`callerEmail` обязателен** во всех write-операциях (cargos, offers, reviews, chats)
6. **Переводы**: добавляй ключи сразу в `ru` + `tj` + `en`
7. **Inline скрипты в `index.html` запрещены** — CSP без `unsafe-inline` для скриптов
