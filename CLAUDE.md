# Ovora Cargo Mobile — CLAUDE.md

Справочник для Claude Code. Читай перед работой с проектом.

## Стек

- **React 18 + TypeScript** + Vite
- **Tailwind CSS v4**
- **React Router v7** (файловые маршруты в `src/app/routes.tsx`)
- **Supabase Edge Functions** — бэкенд на Deno/Hono (`supabase/functions/make-server-4e36197a/index.ts`)
- **sonner** — toast-уведомления (не `react-hot-toast`)
- **lucide-react** — иконки
- **motion/react** — анимации (не `framer-motion`)

## Ключевые файлы

| Файл | Назначение |
|------|-----------|
| `src/app/routes.tsx` | Все маршруты + гарды авторизации |
| `src/app/constants/storageKeys.ts` | **SK** — единственный источник ключей localStorage/sessionStorage |
| `src/app/i18n/translations.ts` | Переводы ru/tj/en. Новые строки добавлять сюда |
| `src/app/api/authApi.ts` | Авторизация, сессия пользователя |
| `src/app/api/dataApi.ts` | CRUD для поездок, грузов, офферов |
| `src/app/api/chatStore.ts` | Логика чатов (optimistic + localStorage кэш) |
| `src/app/contexts/UserContext.tsx` | React-контекст текущего пользователя |
| `src/app/api/subscriptionApi.ts` | Подписки (статус, кэш, хелперы) |
| `src/app/utils/pushService.ts` | Web Push подписка/отписка |
| `supabase/functions/.../index.ts` | Edge Function — все API-маршруты |

## Соглашения

### Storage keys — всегда через SK
```ts
// ✅ Правильно
import { SK } from '../constants/storageKeys';
sessionStorage.getItem(SK.USER_EMAIL)

// ❌ Нельзя
sessionStorage.getItem('ovora_user_email')
```

### i18n — новые строки добавлять в translations.ts
```ts
// ✅ Правильно
const { t } = useLanguage();
t('sub_page_title')

// ❌ Нельзя (кроме admin-only страниц)
<span>Подписка</span>
```

### Toast — только sonner
```ts
import { toast } from 'sonner';
toast.success('...'); toast.error('...');
```

### Темизация
```ts
const { theme } = useTheme();
const dark = theme === 'dark';
// Цвета через inline style или переменные, не через dark: класс Tailwind
```

## Роли пользователей

- `driver` — водитель: создаёт поездки, принимает заявки
- `sender` — отправитель: ищет поездки, подаёт офферты

Текущая роль: `sessionStorage.getItem(SK.USER_ROLE)` или `user?.role` из `useUser()`.

## Маршруты (основные)

```
/             Welcome
/role         Выбор роли
/auth         Авторизация
/home         Дашборд
/trips        Мои поездки
/search       Поиск
/messages     Чаты
/profile      Профиль
/subscription Подписка
/admin/*      Панель администратора
```

## Подписка

- Статусы: `trial` | `active` | `expired` | `lifetime`
- Trial: 30 дней с момента первого GET `/subscription/:email`
- Активация: только через админ-панель `/admin/subscriptions`
- Баннер истечения: `SubscriptionBanner` в `MobileLayout`

## Ветки (активные)

| Ветка | PR | Содержание |
|-------|----|-----------|
| `claude/improvements-batch-1` | #5 | Edge Function маршруты, email, onboarding |
| `claude/improvements-batch-2` | #7 | Profile completeness, quick replies, popular routes |
| `claude/improvements-batch-3` | #8 | storageKeys migration, i18n, console.log drop |

## Команды

```bash
npm run dev    # dev-сервер
npm run build  # prod-сборка (console.* автоматически удаляется)
npm run lint   # линтер
```

## Что нельзя делать

- Использовать сырые строки вместо `SK.*` для localStorage/sessionStorage
- Добавлять `console.log` (они удаляются при сборке, но захламляют код)
- Использовать `react-hot-toast` (заменён на sonner)
- Менять файл `.env` или `supabase/config.toml` без явной просьбы
- Пушить в `main` напрямую
