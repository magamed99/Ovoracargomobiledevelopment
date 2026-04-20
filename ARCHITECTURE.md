# Ovora Cargo Mobile — Полная Архитектура

> Версия: Апрель 2026  
> Стек: React 18 · TypeScript · Tailwind CSS v4 · React Router v7 · Hono · Supabase (KV + Storage + Edge Functions)

---

## Содержание

1. [Обзор системы](#1-обзор-системы)
2. [Структура файлов](#2-структура-файлов)
3. [Frontend: Роутинг](#3-frontend-роутинг)
4. [Frontend: Контексты и состояние](#4-frontend-контексты-и-состояние)
5. [API-слой (dataApi + специализированные API)](#5-api-слой)
6. [Чат: chatStore](#6-чат-chatstore)
7. [Backend: Hono сервер](#7-backend-hono-сервер)
8. [KV Store: все префиксы ключей](#8-kv-store-все-префиксы-ключей)
9. [Supabase Storage: бакеты](#9-supabase-storage-бакеты)
10. [Домены: Trips (Рейсы)](#10-домены-trips-рейсы)
11. [Домены: Cargos (Грузы)](#11-домены-cargos-грузы)
12. [Домены: Offers (Оферты Trip→Sender)](#12-домены-offers-оферты-trip→sender)
13. [Домены: Cargo-Offers (Оферты Driver→Cargo)](#13-домены-cargo-offers-оферты-driver→cargo)
14. [Домены: Chat (Чат)](#14-домены-chat-чат)
15. [Домены: Tracking & Shipments](#15-домены-tracking--shipments)
16. [Домены: Reviews (Отзывы)](#16-домены-reviews-отзывы)
17. [Домены: Notifications (Уведомления)](#17-домены-notifications-уведомления)
18. [Домены: Push Notifications (Web Push)](#18-домены-push-notifications-web-push)
19. [Домены: Documents (Документы)](#19-домены-documents-документы)
20. [Домены: Users & Auth](#20-домены-users--auth)
21. [Домены: Payments](#21-домены-payments)
22. [Домены: Ads (Реклама)](#22-домены-ads-реклама)
23. [Модуль Admin Panel](#23-модуль-admin-panel)
24. [Модуль AVIA](#24-модуль-avia)
25. [Жизненный цикл сделки](#25-жизненный-цикл-сделки)
26. [Кэш-стратегия](#26-кэш-стратегия)
27. [Безопасность](#27-безопасность)
28. [Переменные окружения](#28-переменные-окружения)
29. [Хуки](#29-хуки)
30. [UI-компоненты](#30-ui-компоненты)
31. [Важные правила и ограничения](#31-важные-правила-и-ограничения)

---

## 1. Обзор системы

```
┌────────────────────────────────────────────────────────────────┐
│                     КЛИЕНТ (Browser/PWA)                       │
│  React 18 + TypeScript + Tailwind v4 + React Router v7         │
│  Vite (dev) · PWA · Web Push (VAPID)                          │
└───────────────────────────┬────────────────────────────────────┘
                            │ HTTPS · REST
                            ▼
┌────────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTION (Deno runtime)             │
│  Hono v4 web-framework                                         │
│  Prefix: /make-server-4e36197a/                               │
│  Files: index.tsx · aviaRoutes.tsx · aviaRepo.tsx             │
│         email.tsx · otp.tsx · permCode.tsx · backup.tsx        │
│         rateLimit.tsx · cache.tsx · kv_store.tsx              │
└──────┬─────────────────────────────┬──────────────────────────┘
       │ KV (Postgres jsonb)         │ Supabase Storage
       ▼                             ▼
┌─────────────┐             ┌─────────────────────┐
│  kv_store   │             │  5 приватных бакетов│
│  (единая    │             │  + 2 публичных      │
│   таблица)  │             └─────────────────────┘
└─────────────┘
```

**Роли пользователей:**

| Роль     | Что делает                                              |
|----------|---------------------------------------------------------|
| `driver` | Создаёт рейсы, принимает оферты, управляет трекингом   |
| `sender` | Ищет рейсы, отправляет оферты, размещает объявления о грузах |
| `admin`  | Доступ к панели `/admin/*`, требует `X-Admin-Code`     |

---

## 2. Структура файлов

```
/
├── src/
│   ├── app/
│   │   ├── App.tsx                    # Точка входа, RouterProvider
│   │   ├── routes.tsx                 # Все маршруты (createBrowserRouter)
│   │   │
│   │   ├── api/                       # API-слой (клиентская сторона)
│   │   │   ├── dataApi.ts             # Универсальный REST-клиент (все домены)
│   │   │   ├── authApi.ts             # Auth: login, register, getCachedUser
│   │   │   ├── chatStore.ts           # Чат: optimistic updates + KV sync
│   │   │   ├── chatUtils.ts           # generatePairChatId, generateTripChatId
│   │   │   ├── aviaApi.ts             # AVIA: рейсы, сделки, отзывы
│   │   │   ├── aviaChatApi.ts         # AVIA: чат
│   │   │   ├── aviaDealApi.ts         # AVIA: сделки
│   │   │   ├── aviaFilterApi.ts       # AVIA: фильтры
│   │   │   ├── aviaReviewApi.ts       # AVIA: отзывы
│   │   │   ├── backupApi.ts           # Backup codes (2FA)
│   │   │   ├── documentsApi.ts        # Документы (upload/verify)
│   │   │   ├── notificationsApi.ts    # In-app уведомления
│   │   │   ├── trackingApi.ts         # Трекинг и shipments
│   │   │   ├── userApi.ts             # Профиль пользователя
│   │   │   └── weatherApi.ts          # Погода (OpenWeatherMap)
│   │   │
│   │   ├── contexts/
│   │   │   ├── UserContext.tsx        # Текущий пользователь (глобально)
│   │   │   └── TripsContext.tsx       # Feed рейсов/грузов (роль-зависимо)
│   │   │
│   │   ├── context/
│   │   │   └── ThemeContext.tsx       # dark/light тема
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAvatarUpload.ts     # Загрузка аватара
│   │   │   ├── useDebounce.ts         # Debounce
│   │   │   ├── useFavorites.ts        # Избранное (localStorage)
│   │   │   ├── useIntersectionObserver.ts
│   │   │   ├── useIsMounted.ts        # Защита от setState на unmounted
│   │   │   ├── useOnlineStatus.ts     # Online/offline detector
│   │   │   ├── usePassportUpload.ts   # Загрузка паспорта (AVIA)
│   │   │   ├── usePolling.ts          # Polling с интервалом
│   │   │   └── usePullToRefresh.ts    # Pull-to-refresh gesture
│   │   │
│   │   ├── components/
│   │   │   ├── MobileLayout.tsx       # Shell: нижний таббар + боковое меню desktop
│   │   │   ├── RootLayout.tsx         # Suspense + ErrorBoundary корня
│   │   │   ├── ClientDashboard.tsx    # Главный экран (Home)
│   │   │   ├── DesktopDashboard.tsx   # Desktop вариант главного экрана
│   │   │   ├── SearchPage.tsx         # Форма поиска
│   │   │   ├── SearchResults.tsx      # Результаты поиска (trips + cargo)
│   │   │   ├── TripCard.tsx           # Карточка рейса/груза
│   │   │   ├── TripDetail.tsx         # Детальная страница рейса/груза
│   │   │   │                          #  ├─ ActiveTripDetail (запланирован)
│   │   │   │                          #  ├─ CompletedTripDetail
│   │   │   │                          #  ├─ CancelledTripDetail
│   │   │   │                          #  └─ CargoDetail (объявление груза)
│   │   │   ├── TripsPage.tsx          # Роутер: Driver→DriverTripsPage, Sender→SenderTripsPage
│   │   │   ├── DriverTripsPage.tsx    # Рейсы водителя + входящие оферты
│   │   │   ├── SenderTripsPage.tsx    # Бронирования + Мои грузы (отправитель)
│   │   │   ├── CreateAnnouncementPage.tsx # Создать рейс / Разместить груз
│   │   │   ├── SenderCargoForm.tsx    # Форма создания объявления о грузе
│   │   │   ├── TrackingPage.tsx       # Роутер трекинга
│   │   │   ├── DriverTrackingPage.tsx # Трекинг водителя (GPS + статусы)
│   │   │   ├── SenderTrackingPage.tsx # Трекинг отправителя (просмотр)
│   │   │   ├── PublicTrackingPage.tsx # /track/:tripId — публичная ссылка
│   │   │   ├── ChatPage.tsx           # Чат-комната
│   │   │   ├── MessagesPage.tsx       # Список чатов
│   │   │   ├── ProfilePage.tsx        # Профиль
│   │   │   ├── EditProfile.tsx        # Редактирование профиля
│   │   │   ├── NotificationsPage.tsx  # Уведомления
│   │   │   ├── ReviewsPage.tsx        # Отзывы
│   │   │   ├── PaymentHistory.tsx     # История платежей
│   │   │   ├── DocumentVerificationPage.tsx # Загрузка документов
│   │   │   ├── FavoritesPage.tsx      # Избранное
│   │   │   ├── SettingsPage.tsx       # Настройки
│   │   │   ├── HelpPage.tsx           # Помощь
│   │   │   ├── AboutPage.tsx          # О приложении
│   │   │   ├── PriceCalculator.tsx    # Калькулятор стоимости
│   │   │   ├── BordersPage.tsx        # Таможенные посты (для водителей)
│   │   │   ├── RestStopsPage.tsx      # Стоянки
│   │   │   ├── RadioPage.tsx          # Дальнобойное радио
│   │   │   ├── Welcome.tsx            # Экран приветствия
│   │   │   ├── RoleSelect.tsx         # Выбор роли
│   │   │   ├── EmailAuth.tsx          # Вход/регистрация по email
│   │   │   ├── DriverRegistrationForm.tsx
│   │   │   ├── SenderRegistrationForm.tsx
│   │   │   ├── DriverDashboardActions.tsx # Quick-actions для водителя
│   │   │   ├── SenderDashboardActions.tsx # Quick-actions для отправителя
│   │   │   ├── ProposalCard.tsx        # Карточка коммерческого предложения в чате
│   │   │   ├── ProposalFormModal.tsx   # Модал создания предложения
│   │   │   ├── RouteMap.tsx            # Карта маршрута (Yandex Maps)
│   │   │   ├── WeatherAnimation.tsx    # Анимация погоды
│   │   │   ├── MapBackground.tsx       # Фоновая карта
│   │   │   ├── OfflineBanner.tsx       # Баннер "нет интернета"
│   │   │   ├── PushPermissionBanner.tsx # Баннер разрешения push
│   │   │   ├── PullIndicator.tsx       # Pull-to-refresh индикатор
│   │   │   ├── SkeletonCard.tsx        # Скелетон загрузки
│   │   │   ├── VoiceMessage.tsx        # Голосовые сообщения
│   │   │   ├── YandexMetrika.tsx       # Яндекс Метрика
│   │   │   ├── CompetitorAnalysisPage.tsx # Анализ конкурентов (внутренний)
│   │   │   ├── TripFilters.tsx         # Фильтры поиска
│   │   │   ├── AddressPicker.tsx       # Пикер адреса (Yandex Geocoder)
│   │   │   ├── BackupCodeModal.tsx     # Резервный код 2FA
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ErrorPage.tsx
│   │   │   │
│   │   │   ├── admin/                 # Панель администратора
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── AdminAuthGate.tsx
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AdminPageHeader.tsx
│   │   │   │   ├── DriversManagement.tsx
│   │   │   │   ├── UsersManagement.tsx
│   │   │   │   ├── TripsManagement.tsx
│   │   │   │   ├── OffersManagement.tsx
│   │   │   │   ├── DocumentVerification.tsx
│   │   │   │   ├── Analytics.tsx
│   │   │   │   ├── Reviews.tsx
│   │   │   │   ├── AdsManagement.tsx
│   │   │   │   ├── CodeManagement.tsx
│   │   │   │   └── Settings.tsx
│   │   │   │
│   │   │   ├── avia/                  # Авиа-модуль (отдельный мини-продукт)
│   │   │   │   ├── AviaAuth.tsx
│   │   │   │   ├── AviaLayout.tsx
│   │   │   │   ├── AviaDashboard.tsx
│   │   │   │   ├── AviaDealsPage.tsx
│   │   │   │   ├── AviaMessagesPage.tsx
│   │   │   │   ├── AviaProfile.tsx
│   │   │   │   ├── AviaPublicProfile.tsx
│   │   │   │   ├── AviaContext.tsx
│   │   │   │   ├── ... (29 компонентов)
│   │   │   │
│   │   │   ├── map/
│   │   │   │   ├── MapView.tsx
│   │   │   │   ├── LiveTrackingMap.tsx
│   │   │   │   └── DriverRouteMap.tsx
│   │   │   │
│   │   │   ├── figma/
│   │   │   │   └── ImageWithFallback.tsx  # ЗАЩИЩЁННЫЙ ФАЙЛ
│   │   │   │
│   │   │   └── ui/                    # shadcn/ui компоненты (50+)
│   │   │       ├── StarRow.tsx
│   │   │       ├── button.tsx · input.tsx · dialog.tsx · ...
│   │   │
│   │   ├── constants/
│   │   │   └── avatars.ts             # Дефолтные аватары
│   │   │
│   │   ├── utils/
│   │   │   └── addressUtils.ts        # cleanAddress(), formatDistance()
│   │   │
│   │   ├── i18n/                      # (резерв для локализации)
│   │   ├── config/                    # (конфигурация)
│   │   └── data/                      # (статические данные)
│   │
│   └── styles/
│       ├── theme.css                  # CSS-токены (цвета, отступы)
│       └── fonts.css                  # @import шрифтов (только здесь!)
│
├── supabase/functions/server/
│   ├── index.tsx                      # Hono app: все основные маршруты
│   ├── aviaRoutes.tsx                 # AVIA: HTTP маршруты
│   ├── aviaRepo.tsx                   # AVIA: Data Access Layer
│   ├── email.tsx                      # Отправка email (Resend)
│   ├── otp.tsx                        # OTP через email
│   ├── permCode.tsx                   # Постоянные коды доступа
│   ├── backup.tsx                     # Backup-коды (2FA)
│   ├── rateLimit.tsx                  # Rate limiting (in-memory)
│   ├── cache.tsx                      # In-memory кэш (AVIA)
│   └── kv_store.tsx                   # ЗАЩИЩЁННЫЙ ФАЙЛ — обёртка над KV
│
├── utils/supabase/
│   └── info.tsx                       # ЗАЩИЩЁННЫЙ ФАЙЛ — projectId, publicAnonKey
│
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── sw.js                          # Service Worker (Web Push)
│
└── ARCHITECTURE.md                    # ← этот файл
```

---

## 3. Frontend: Роутинг

**Движок:** `react-router` v7 в Data Mode (`createBrowserRouter`)

### Дерево маршрутов

```
/                           → Welcome
/welcome                    → Welcome
/role-select                → RoleSelect
/email-auth                 → EmailAuth
/driver-registration-form   → DriverRegistrationForm
/sender-registration-form   → SenderRegistrationForm

/avia                       → AviaAuth (guard: редирект если уже авторизован)
└── [AviaLayout]            (guard: requireAviaAuth)
    ├── /avia/dashboard     → AviaDashboard
    ├── /avia/profile       → AviaProfile
    ├── /avia/deals         → AviaDealsPage
    ├── /avia/messages      → AviaMessagesPage
    └── /avia/user/:phone   → AviaPublicProfile

[MobileLayout]              (guard: requireAuth)
├── /home                   → ClientDashboard (Home)
├── /dashboard              → ClientDashboard (alias)
├── /search                 → SearchPage
├── /search-results         → SearchResults  (?type=cargo → грузы для водителей)
├── /create-trip            → CreateAnnouncementPage
├── /trip/:id               → TripDetail
├── /trips                  → TripsPage  →  DriverTripsPage | SenderTripsPage
├── /tracking               → TrackingPage → DriverTrackingPage | SenderTrackingPage
├── /messages               → MessagesPage
├── /chat/:id               → ChatPage
├── /profile                → ProfilePage
├── /profile/edit           → EditProfile
├── /notifications          → NotificationsPage
├── /payments               → PaymentHistory
├── /reviews                → ReviewsPage
├── /documents              → DocumentVerificationPage
├── /settings               → SettingsPage
├── /help                   → HelpPage
├── /about                  → AboutPage
├── /calculator             → PriceCalculator
├── /favorites              → FavoritesPage
├── /privacy-policy         → PrivacyPolicyPage
├── /terms-of-service       → TermsOfServicePage
├── /borders                → BordersPage (только для водителей)
├── /rest-stops             → RestStopsPage
└── /radio                  → RadioPage

/admin                      → AdminLayout (guard: requireAdmin)
├── /admin/                 → AdminDashboard
├── /admin/drivers          → DriversManagement
├── /admin/users            → UsersManagement
├── /admin/trips            → TripsManagement
├── /admin/offers           → OffersManagement
├── /admin/verification     → DocumentVerification
├── /admin/analytics        → Analytics
├── /admin/reviews          → Reviews
├── /admin/codes            → CodeManagement
├── /admin/ads              → AdsManagement
└── /admin/settings         → SettingsPage

/track/:tripId              → PublicTrackingPage (без авторизации)
/competitor-analysis        → CompetitorAnalysisPage
```

### Guards

```typescript
// requireAuth: проверяет sessionStorage + localStorage fallback
function requireAuth() {
  if (sessionStorage.getItem('isAuthenticated') === 'true') return null;
  const persistent = JSON.parse(localStorage.getItem('ovora_auth_persistent') || '{}');
  if (persistent.email && persistent.role) { /* restore session */ return null; }
  return redirect('/');
}

// requireAviaAuth: проверяет AviaSession в localStorage
function requireAviaAuth() {
  const session = getAviaSession();
  if (!session?.user?.phone) return redirect('/avia');
  return null;
}
```

### Lazy loading

Все компоненты кроме `Welcome`, `RoleSelect`, `EmailAuth`, `MobileLayout`, `RootLayout`, `ErrorPage`, `AviaErrorBoundary` загружаются через `lazy()` встроенный в React Router:

```typescript
{
  path: "trip/:id",
  lazy: () => import("./components/TripDetail").then(m => ({ Component: m.TripDetail })),
}
```

---

## 4. Frontend: Контексты и состояние

### UserContext (`/contexts/UserContext.tsx`)

Глобальный контекст текущего авторизованного пользователя.

```typescript
interface User {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName?: string;
  phone?: string;
  birthDate?: string;
  role?: 'sender' | 'driver';
  avatarUrl?: string;
  city?: string;
  about?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  setUserEmail: (email: string) => void;
  setUserDirectly: (userData: Partial<User>) => void;
  logout: () => void;
}
```

**Стратегия кэша:**
- `localStorage['ovora_current_user']` — offline-fallback
- При смене email кэш полностью сбрасывается (защита от показа чужого профиля)

### TripsContext (`/contexts/TripsContext.tsx`)

Контекст фида рейсов/грузов — зависит от роли:

```
Driver  → getCargos()   (грузы от отправителей)
Sender  → getTrips()    (рейсы от водителей)
```

Поля: `trips`, `activeTrip`, `loading`, `error`, `refreshTrips()`

**Важно:** `SearchResults` и все детальные страницы НЕ используют TripsContext — они загружают данные напрямую через `dataApi`.

### ThemeContext (`/context/ThemeContext.tsx`)

`dark` | `light` — хранится в localStorage.

### Локальное состояние

Каждая страница управляет своим состоянием через `useState/useCallback`. Глобальных store (Zustand/Redux) нет.

---

## 5. API-слой

### dataApi.ts — центральный REST-клиент

**Базовый URL:**
```
https://{projectId}.supabase.co/functions/v1/make-server-4e36197a
```

**Headers:**
```typescript
Authorization: `Bearer ${publicAnonKey}`
Content-Type: application/json
X-Admin-Code: <admin_code>  // только для /admin/* и /kv/*
```

**Retry-логика:**
```
3 попытки с exponential backoff (800ms, 1600ms)
12-секундный таймаут на каждый запрос
Retry ТОЛЬКО при сетевых ошибках (TypeError), не при 4xx/5xx
```

**In-memory кэш:**
```typescript
TRIPS_TTL  = 30_000  // 30 сек
USER_TTL   = 60_000  // 60 сек
STATS_TTL  = 120_000 // 2 мин
```

### Все функции dataApi

#### TRIPS
| Функция | Метод | Путь |
|---------|-------|------|
| `createTrip(trip)` | POST | `/trips` |
| `getTrips()` | GET | `/trips` |
| `getTripsByIds(ids[])` | POST | `/trips/batch` |
| `getMyTrips(email)` | GET | `/trips/my/:email` |
| `getTripById(id)` | GET | `/trips/:id` |
| `updateTrip(id, updates)` | PUT | `/trips/:id` |
| `deleteTrip(id)` | DELETE | `/trips/:id` |

#### CARGOS
| Функция | Метод | Путь |
|---------|-------|------|
| `createCargo(cargo)` | POST | `/cargos` |
| `getCargos()` | GET | `/cargos` |
| `getMyCargos(email)` | GET | `/cargos/my/:email` |
| `getCargoById(id)` | GET | `/cargos/:id` |
| `updateCargo(id, updates)` | PUT | `/cargos/:id` |
| `deleteCargo(id)` | DELETE | `/cargos/:id` |

#### OFFERS (Trip ↔ Sender)
| Функция | Метод | Путь |
|---------|-------|------|
| `submitOffer(offer)` | POST | `/offers` |
| `getOffersForTrip(tripId)` | GET | `/offers/trip/:tripId` |
| `getOffersForUser(email)` | GET | `/offers/user/:email` |
| `getOffersForDriver(email)` | GET | `/offers/driver/:email` |
| `updateOffer(tripId, offerId, updates)` | PUT | `/offers/:tripId/:offerId` |
| `cleanupOrphanedOffers(driverEmail)` | POST | `/offers/cleanup` |

#### CARGO-OFFERS (Driver → Cargo)
| Функция | Метод | Путь |
|---------|-------|------|
| `submitCargoOffer(offer)` | POST | `/cargo-offers` |
| `getCargoOffersForCargo(cargoId)` | GET | `/cargo-offers/cargo/:cargoId` |
| `getCargoOffersForDriver(email)` | GET | `/cargo-offers/driver/:email` |
| `getCargoOffersForSender(email)` | GET | `/cargo-offers/sender/:email` |
| `updateCargoOffer(cargoId, offerId, updates)` | PUT | `/cargo-offers/:cargoId/:offerId` |

#### CHAT
| Функция | Метод | Путь |
|---------|-------|------|
| `initChat(chatId, participants, ...)` | POST | `/chat/init` |
| `sendMessage(msg)` | POST | `/chat/message` |
| `getChatMessages(chatId)` | GET | `/chat/:chatId/messages` |
| `markChatRead(chatId, email)` | PUT | `/chat/:chatId/read` |
| `updateChatProposal(chatId, proposalId, status)` | PUT | `/chat/:chatId/proposal/:proposalId` |
| `getUserChats(email)` | GET | `/chats/user/:email` |
| `deleteChatFromDb(chatId)` | DELETE | `/chat/:chatId` |
| `deleteMessageFromDb(chatId, msgId)` | DELETE | `/chat/:chatId/message/:msgId` |

#### REVIEWS
| Функция | Метод | Путь |
|---------|-------|------|
| `submitReview(review)` | POST | `/reviews` |
| `getReviewsForUser(email)` | GET | `/reviews/user/:email` |
| `getAllReviews()` | GET | `/reviews` |

#### NOTIFICATIONS
| Функция | Метод | Путь |
|---------|-------|------|
| `pushNotifToDb(email, notification)` | POST | `/notifications` |
| `getNotificationsFromDb(email)` | GET | `/notifications/:email` |

#### DOCUMENTS
| Функция | Метод | Путь |
|---------|-------|------|
| `uploadDocument(file, email, docType)` | POST | `/documents/upload` |
| `getUserDocuments(email)` | GET | `/documents/:email` |

#### USERS & STATS
| Функция | Метод | Путь |
|---------|-------|------|
| `getUserStats(email, role)` | GET | `/users/:email/stats?role=` |
| `getPublicStats()` | GET | `/stats` |
| `getUserPayments(email, role)` | GET | `/payments/:email?role=` |

#### ADS
| Функция | Метод | Путь |
|---------|-------|------|
| `getPublicAds(placement?)` | GET | `/ads` |
| `getAdminAds()` | GET | `/admin/ads` |
| `createAdminAd(ad)` | POST | `/admin/ads` |
| `updateAdminAd(id, ad)` | PUT | `/admin/ads/:id` |
| `deleteAdminAd(id)` | DELETE | `/admin/ads/:id` |
| `uploadAdMedia(file, type)` | POST | `/admin/ads/upload` |

#### ADMIN
| Функция | Метод | Путь |
|---------|-------|------|
| `getAdminStats()` | GET | `/admin/stats` |
| `getAdminUsers()` | GET | `/admin/users` |
| `getAdminTrips()` | GET | `/admin/trips` |
| `getAdminOffers()` | GET | `/admin/offers` |
| `getAdminReviews()` | GET | `/admin/reviews` |
| `getAdminDocuments()` | GET | `/admin/documents` |
| `updateAdminDocStatus(id, email, status)` | PUT | `/admin/documents/:id/status` |
| `getAdminSettings()` | GET | `/admin/settings` |
| `saveAdminSettings(settings)` | PUT | `/admin/settings` |

### trackingApi.ts

Типы статусов shipment:
```typescript
type ShipmentStatus =
  | 'pending'     // Ожидает погрузки
  | 'loaded'      // Груз загружен
  | 'inProgress'  // В пути
  | 'customs'     // На таможне
  | 'arrived'     // Прибыл в пункт назначения
  | 'delivered'   // Доставлен получателю
  | 'completed'   // Завершено (alias delivered)
  | 'cancelled';  // Отменено
```

API:
```
POST /shipments              — создать shipment
GET  /shipments/:tripId      — получить по tripId
PUT  /shipments/:shipmentId/status — обновить статус
POST /shipments/:shipmentId/pod    — Proof of Delivery (фото)
GET  /track/:tripId          — публичный трекинг
```

### notificationsApi.ts

```typescript
interface Notification {
  id: string;
  userEmail: string;
  type: 'trip' | 'system' | 'payment' | 'info' | 'auth' | 'offer' | 'message' | 'document';
  iconName: string;
  iconBg: string;
  title: string;
  description: string;
  isUnread: boolean;
  createdAt: string;
}
```

### weatherApi.ts

Источники (приоритет):
1. OpenWeatherMap API (ключ: `VITE_OPENWEATHER_API_KEY`)
2. GPS координаты пользователя
3. Приближённые координаты по названию города
4. Mock данные (fallback)

---

## 6. Чат: chatStore

**Файл:** `/api/chatStore.ts`

### Архитектура

```
Запрос UI → Optimistic update (localStorage) → API (KV) → Sync back
```

### Типы

```typescript
interface ChatMessage {
  id: string;           // msgId (opt_* для optimistic)
  type: 'text' | 'proposal' | 'system';
  text?: string;
  proposal?: ChatProposal;
  from: 'driver' | 'sender' | 'system';
  senderId: string;
  time: string;         // "HH:MM"
  ts: number;           // timestamp ms
  read: boolean;
  senderName?: string;
  senderAvatar?: string;
}

interface ChatProposal {
  id: string;
  cargoType: string;
  weight: string;
  volume: string;
  price: string;
  currency: 'TJS' | 'RUB' | 'USD';
  from: string;
  to: string;
  date: string;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected' | 'declined' | 'countered';
  vehicleType: string;
  tripId?: string;
  senderEmail?: string;
  fromLat?: number;  fromLng?: number;
  toLat?: number;    toLng?: number;
  departureTime?: string;
}
```

### Функции chatStore

```typescript
initChatRoom(chatId, contact, tripId, tripRoute, trip?)
getChats()                          // из localStorage
pushMessage(chatId, message)        // optimistic + API
loadMessages(chatId, myEmail)       // из API с fallback на localStorage
markAsRead(chatId, userEmail)
deleteChat(chatId)
deleteMessage(chatId, msgId)
updateProposalStatus(chatId, proposalId, status, senderId)
```

### Генерация chatId

```typescript
// Пара пользователей (детерминированный, не зависит от порядка)
generatePairChatId(email1, email2): string
// → btoa(sorted([email1, email2]).join('::'))

// Групповой чат рейса
generateTripChatId(tripId): string
// → `trip_${tripId}`
```

---

## 7. Backend: Hono сервер

**Runtime:** Deno (Supabase Edge Functions)  
**Framework:** Hono v4  
**Файл:** `/supabase/functions/server/index.tsx`

### Структура сервера

```typescript
const app = new Hono();
app.use('*', logger(console.log));
app.use("/*", cors({ origin: "*", ... }));

// Admin middleware для /admin/* и /kv/*
app.use('/make-server-4e36197a/admin/*', requireAdmin);
app.use('/make-server-4e36197a/kv/*', requireAdmin);

// Подключение AVIA маршрутов
setupAviaRoutes(app, { supabase, ... });

Deno.serve(app.fetch);
```

### Все серверные маршруты (основные)

```
GET    /health

# PUSH NOTIFICATIONS
GET    /push/vapid-public-key
POST   /push/subscribe
POST   /push/unsubscribe

# AUTH / ADMIN
POST   /admin/auth
GET    /config/yandex-key
GET    /config/push-key

# OTP
POST   /otp/send
POST   /otp/verify

# PERM CODES
POST   /perm-code/check-email
POST   /perm-code/set
POST   /perm-code/verify
POST   /perm-code/reset
GET    /admin/codes

# BACKUP CODES
POST   /backup/generate
POST   /backup/verify
GET    /backup/exists/:email

# USERS
GET    /users/:email
POST   /users/:email
PUT    /users/:email
GET    /users/:email/stats
GET    /stats

# TRIPS
GET    /trips
POST   /trips
POST   /trips/batch
GET    /trips/:id
PUT    /trips/:id
DELETE /trips/:id
GET    /trips/my/:email

# CARGOS
GET    /cargos
POST   /cargos
GET    /cargos/:id
PUT    /cargos/:id
DELETE /cargos/:id
GET    /cargos/my/:email

# OFFERS (Trip→Sender)
POST   /offers
GET    /offers/trip/:tripId
GET    /offers/user/:email
GET    /offers/driver/:email
PUT    /offers/:tripId/:offerId
POST   /offers/cleanup

# CARGO-OFFERS (Driver→Cargo)
POST   /cargo-offers
GET    /cargo-offers/cargo/:cargoId
GET    /cargo-offers/driver/:email
GET    /cargo-offers/sender/:email
PUT    /cargo-offers/:cargoId/:offerId

# CHAT
POST   /chat/init
POST   /chat/message
GET    /chat/:chatId/messages
PUT    /chat/:chatId/read
PUT    /chat/:chatId/proposal/:proposalId
DELETE /chat/:chatId
DELETE /chat/:chatId/message/:msgId
GET    /chats/user/:email

# SHIPMENTS (Tracking)
POST   /shipments
GET    /shipments/:tripId
PUT    /shipments/:shipmentId/status
POST   /shipments/:shipmentId/pod
GET    /track/:tripId           # публичный, без авторизации

# REVIEWS
POST   /reviews
GET    /reviews
GET    /reviews/user/:email

# NOTIFICATIONS
POST   /notifications
GET    /notifications/:email
PUT    /notifications/:email/read-all

# DOCUMENTS
POST   /documents/upload
GET    /documents/:email

# PAYMENTS
GET    /payments/:email

# ADS
GET    /ads
POST   /admin/ads
GET    /admin/ads
PUT    /admin/ads/:id
DELETE /admin/ads/:id
POST   /admin/ads/upload

# ADMIN
GET    /admin/stats
GET    /admin/users
GET    /admin/trips
GET    /admin/offers
GET    /admin/reviews
GET    /admin/documents
PUT    /admin/documents/:id/status
GET    /admin/settings
PUT    /admin/settings

# KV (прямой доступ, только для admin)
GET    /kv/:key
PUT    /kv/:key
DELETE /kv/:key

# AVIA (100+ маршрутов — см. раздел 24)
/avia/...
```

### Email-уведомления сервера

Отправляются автоматически при событиях:

| Событие | Шаблон |
|---------|--------|
| Регистрация | `welcomeTemplate` |
| Новая оферта | `newOfferTemplate` |
| Оферта принята | `offerAcceptedTemplate` |
| Оферта отклонена | `offerRejectedTemplate` |
| Рейс завершён | `tripCompletedTemplate` |
| Новое сообщение | `newMessageTemplate` |

**Throttle:** каждый шаблон имеет ограничение по частоте (не чаще 1 раза в N минут на email).

---

## 8. KV Store: все префиксы ключей

> Единственная таблица БД: `kv_store_4e36197a`  
> Функции: `get`, `set`, `del`, `mget`, `mset`, `mdel`, `getByPrefix`

### Основные домены

```
# ──── USERS ────
ovora:user:{email}                    → User object

# ──── TRIPS ────
ovora:trip:{tripId}                   → Trip object
ovora:usertrips:{email}:{tripId}      → Index: email → его рейсы

# ──── CARGOS ────
ovora:cargo:{cargoId}                 → Cargo object
ovora:usercargos:{email}:{cargoId}    → Index: email → его грузы

# ──── OFFERS (Trip ↔ Sender) ────
ovora:offer:{tripId}:{offerId}        → Offer object
ovora:usertrips:{senderEmail}:{offerId} → Index: sender → его оферты
ovora:tripoffers:{tripId}:{offerId}   → Index: trip → входящие оферты

# ──── CARGO-OFFERS (Driver → Cargo) ────
ovora:cargo-offer:{cargoId}:{offerId}            → CargoOffer object
ovora:drivercargooffers:{driverEmail}:{offerId}  → Index: driver → его отклики
ovora:sendercargooffers:{senderEmail}:{offerId}  → Index: sender → отклики на его грузы

# ──── CHAT ────
ovora:chat:{chatId}                   → Chat metadata (участники, маршрут)
ovora:chat:{chatId}:msg:{msgId}       → Сообщение
ovora:userchat:{email}:{chatId}       → Index: email → его чаты

# ──── SHIPMENTS (Tracking) ────
ovora:shipment:{shipmentId}           → Shipment object (6 статусов + история)
ovora:tripshipment:{tripId}           → Index: tripId → shipmentId

# ──── REVIEWS ────
ovora:review:{reviewId}               → Review object
ovora:userreviews:{email}:{reviewId}  → Index: email → отзывы о нём

# ──── NOTIFICATIONS ────
ovora:notif:{email}:{notifId}         → Notification object

# ──── DOCUMENTS ────
ovora:doc:{email}:{docType}           → Document metadata + Storage URL

# ──── PUSH SUBSCRIPTIONS ────
ovora:vapid:keys                      → { publicKey, privateKey }
ovora:push:sub:{email}:{subId}        → PushSubscription (endpoint, keys)

# ──── PAYMENTS ────
ovora:payment:{email}:{paymentId}     → Payment object

# ──── ADS ────
ovora:ad:{adId}                       → Ad object

# ──── ADMIN SETTINGS ────
ovora:admin:settings                  → { commissionRate, ... }

# ──── PERM CODES (доступ по invite) ────
ovora:perm-code:{code}                → { email, createdAt, usedAt? }

# ──── BACKUP CODES ────
ovora:backup:{email}                  → { codes: string[], createdAt }

# ──── OTP ────
ovora:otp:{email}                     → { code, expiresAt }

# ──── RATE LIMIT (in-memory в AVIA — не KV) ────
# (rateLimit.tsx — Map в памяти Deno)

# ──── AVIA ────
ovora:avia-user:{phone}               → AviaUser
ovora:avia-user-pin:{phone}           → bcrypt(pin)
ovora:avia-flight:{flightId}          → AviaFlight
ovora:avia-request:{requestId}        → AviaRequest
ovora:avia-deal:{dealId}              → AviaDeal
ovora:avia-chat:{chatId}              → AviaChatMeta
ovora:avia-msg:{chatId}:{msgId}       → AviaMessage
ovora:avia-notif:{phone}:{notifId}    → AviaNotif
ovora:avia-review:{reviewId}          → AviaReview
ovora:avia-pin-log:{phone}            → { attempts, lockoutUntil }
```

---

## 9. Supabase Storage: бакеты

| Бакет | Публичный | Назначение |
|-------|-----------|------------|
| `make-4e36197a-documents` | ❌ | Документы водителей (права, паспорт) |
| `make-4e36197a-avatars` | ✅ | Аватары пользователей |
| `make-4e36197a-ads` | ✅ | Медиа для рекламных баннеров |
| `make-4e36197a-avia-passports` | ❌ | Паспорта AVIA-курьеров |
| `make-4e36197a-pod` | ❌ | Proof of Delivery (фото при сдаче груза) |

**Доступ:** приватные бакеты → signed URL через `.createSignedUrl()` (сервер генерирует)  
**Публичные бакеты** → прямой URL

---

## 10. Домены: Trips (Рейсы)

**Создатель:** Driver  
**Потребитель:** Sender (поиск и бронирование)

### Схема объекта Trip

```typescript
{
  id: string;               // UUID
  driverEmail: string;
  driverName: string;
  driverPhone: string;
  driverAvatar?: string;
  driverRating?: number;
  from: string;             // Адрес отправления
  to: string;               // Адрес назначения
  fromLat?: number;         // Координаты
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  date: string;             // "YYYY-MM-DD"
  time: string;             // "HH:MM"
  vehicle: string;          // Тип ТС
  availableSeats: number;
  childSeats: number;
  cargoCapacity: number;    // кг
  pricePerSeat: number;
  pricePerChild: number;
  pricePerKg: number;
  currency: string;         // "TJS"
  notes?: string;
  images?: string[];        // URL фото
  status: 'planned' | 'inProgress' | 'completed' | 'cancelled' | 'frozen';
  tripType: 'trip';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;       // Soft delete
}
```

### Статусы рейса

```
planned → inProgress → completed
                   ↘ cancelled
frozen  → planned | cancelled
```

**Frozen:** рейс заморожен (недостаточно пассажиров/груза) — виден, но нельзя бронировать.

---

## 11. Домены: Cargos (Грузы)

**Создатель:** Sender (размещает объявление о грузе)  
**Потребитель:** Driver (просматривает и откликается)

### Схема объекта Cargo

```typescript
{
  id: string;
  senderEmail: string;
  senderName: string;
  senderPhone?: string;
  senderAvatar?: string;
  from: string;
  to: string;
  date: string;
  cargoType?: string;
  cargoWeight: number;      // кг
  budget?: number;          // Максимальный бюджет
  currency: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  tripType: 'cargo';        // Признак для маршрутизации в TripDetail
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

**Отображение в интерфейсе:**
- `TripsContext (driver)` → фид на главном экране водителя
- `/trip/:id` → `CargoDetail` (через `isCargo` флаг в TripDetail)
- `/trips (sender)` → вкладка "Мои грузы" в SenderTripsPage
- `/search-results?type=cargo` → поиск грузов для водителей

---

## 12. Домены: Offers (Оферты Trip→Sender)

**Сценарий:** Sender нашёл рейс водителя и отправил оферту на бронирование.

### Схема Offer

```typescript
{
  offerId: string;
  tripId: string;
  senderEmail: string;
  senderName: string;
  senderPhone?: string;
  driverEmail: string;
  type: 'seats' | 'cargo' | 'both';
  cargoType: string;
  weight: string;           // "2 взр. + 15 кг"
  volume: string;
  price: number;
  currency: string;
  notes: string;
  requestedSeats: number;
  requestedChildren: number;
  requestedCargo: number;   // кг
  from: string;
  to: string;
  date: string;
  vehicleType: string;
  status: 'pending' | 'accepted' | 'declined' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
```

### Поток создания оферты

```
1. Sender открывает TripDetail → кнопка "Отправить оферту"
2. Bottom sheet: выбор мест/груза, цена, контакты
3. submitOfferApi(offerData)  →  POST /offers (KV)
4. initChatRoom()             →  создать чат между участниками
5. pushMessage()              →  отправить proposal-сообщение в чат
6. setAlreadyOffered(true)    →  CTA меняется на "Ожидание"
7. navigate('/chat/:chatId')
```

### Поток принятия (водитель)

```
1. Driver видит badge "N ожидает" в TripDetail/DriverTripsPage
2. Нажимает "Принять" → handleAcceptOffer(offer)
3. PUT /offers/:tripId/:offerId { status: 'accepted' }
4. Сервер: уменьшает availableSeats/cargoCapacity
5. Сервер: отправляет email + push отправителю
6. UI: статус меняется на "Принята ✅"
```

---

## 13. Домены: Cargo-Offers (Оферты Driver→Cargo)

**Сценарий:** Driver нашёл объявление груза и откликнулся на него.

### Схема CargoOffer

```typescript
{
  offerId: string;
  cargoId: string;
  driverEmail: string;
  driverName: string;
  driverPhone?: string;
  driverAvatar?: string | null;
  senderEmail: string;        // Автозаполняется из Cargo
  senderName: string;
  price?: number;
  currency: string;
  notes?: string;             // Авто: тип авто + комментарий
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}
```

### Защита от дублей

```
Сервер: проверяет ovora:drivercargooffers:{email}:* перед созданием
Если статус pending → 409 Conflict
```

### Поток (водитель откликается)

```
1. Driver открывает CargoDetail → sticky CTA "Откликнуться на груз"
2. Bottom sheet: тип авто, цена, комментарий (автозаполнение из профиля)
3. submitCargoOffer()  →  POST /cargo-offers (KV)
4. Сервер: создаёт оферту + уведомление + push отправителю
5. UI: CTA меняется на "Отклик отправлен · Ожидание"
```

### Поток (отправитель принимает)

```
1. Sender открывает CargoDetail → видит "N откликов" с бейджем
2. Нажимает "Принять" → handleAcceptOffer(offer)
3. PUT /cargo-offers/:cargoId/:offerId { status: 'accepted' }
4. UI: показывается телефон водителя
5. Карточка груза (SenderTripsPage): "Водитель выбран ✅"
```

---

## 14. Домены: Chat (Чат)

### Архитектура чата

```
ChatPage (UI)
  ↓ useEffect → loadMessages()
chatStore.loadMessages()
  ↓ API: GET /chat/:chatId/messages
  ↓ Fallback: localStorage['ovora_chat_{chatId}']
  ↓ Returns: ChatMessage[]

sendMessage (UI)
  ↓ pushMessage(chatId, optimisticMsg)  (localStorage сразу)
  ↓ apiSendMessage()  (KV через API)
  ↓ replace optimistic msg with server id
```

### Polling

Сообщения обновляются каждые 3 секунды через `usePolling`:
```typescript
usePolling(() => loadMessages(chatId, myEmail), 3000, document.visibilityState !== 'hidden')
```

### Proposal (коммерческое предложение)

Тип сообщения `'proposal'` — специальная карточка с кнопками "Принять"/"Отклонить":

```
ProposalCard.tsx
  → updateProposalStatus(chatId, proposalId, 'accepted', senderId)
  → PUT /chat/:chatId/proposal/:proposalId { status, senderId }
  → Сервер: обновляет offer.status в KV
```

---

## 15. Домены: Tracking & Shipments

### 6 этапов доставки

```
pending → loaded → inProgress → customs → arrived → delivered
```

| Статус | Emoji | Описание |
|--------|-------|----------|
| `pending` | ⏳ | Ожидает погрузки |
| `loaded` | 📦 | Груз загружен |
| `inProgress` | 🚚 | В пути |
| `customs` | 🛂 | На таможне |
| `arrived` | 📍 | Прибыл |
| `delivered` | ✅ | Доставлен |

### Компоненты трекинга

```
TrackingPage.tsx  →  role-router
  ├── DriverTrackingPage.tsx   — управление: смена статуса, GPS, Proof of Delivery
  └── SenderTrackingPage.tsx   — просмотр: текущий статус, история, карта

PublicTrackingPage.tsx  →  /track/:tripId  (без авторизации)
```

### Proof of Delivery (POD)

```
1. Driver нажимает "Сдача груза" → загружает фото
2. POST /shipments/:shipmentId/pod (multipart/form-data)
3. Файл → Supabase Storage (make-4e36197a-pod)
4. shipment.podUrl = signed URL
5. Статус меняется на 'delivered'
6. Email + Push уведомление отправителю
```

---

## 16. Домены: Reviews (Отзывы)

### Схема Review

```typescript
{
  reviewId: string;
  authorEmail: string;
  authorName: string;
  targetEmail: string;       // О ком отзыв
  tripId: string;
  rating: number;            // 1–5
  comment: string;
  categories: {
    punctuality: number;     // 1–5
    reliability: number;
    communication: number;
    packaging: number;
  };
  type: 'given';
  verified: boolean;
  tripRoute?: string;
  createdAt: string;
}
```

**Защита от дублей:** 409 при повторном отзыве на тот же tripId от того же автора.

---

## 17. Домены: Notifications (Уведомления)

Уведомления создаются сервером автоматически при событиях:

| Событие | Тип | Иконка |
|---------|-----|--------|
| Новая оферта | `offer` | 📨 |
| Оферта принята | `trip` | ✅ |
| Оферта отклонена | `trip` | ❌ |
| Новое сообщение | `message` | 💬 |
| Груз доставлен | `trip` | 📦 |
| Документ одобрен/отклонён | `document` | 📄 |

Polling в `NotificationsPage`: каждые 10 секунд.

---

## 18. Домены: Push Notifications (Web Push)

### Инициализация VAPID

```
Сервер → initVapid() при старте (delay 12s)
1. Проверяет KV: ovora:vapid:keys
2. Если нет → генерирует новую пару ключей
3. Сохраняет в KV
4. webpush.setVapidDetails(...)
```

### Retry-стратегия VAPID

До 10 попыток с backoff:
- "broken pipe" / cold-start → retry через 1 секунду
- Другие ошибки → 4s, 8s, 15s, 25s, 35s, 50s, 60s...

### Регистрация подписки

```
Frontend (PushPermissionBanner.tsx):
1. Запрашивает разрешение браузера
2. GET /push/vapid-public-key → publicKey
3. serviceWorker.pushManager.subscribe({ applicationServerKey })
4. POST /push/subscribe { email, subscription }
5. KV: ovora:push:sub:{email}:{subId}
```

### Отправка push (сервер)

```typescript
sendPushToUser(email, { title, body, url, tag, icon })
→ getByPrefix(`ovora:push:sub:${email}:`)
→ webpush.sendNotification(sub, payload) для каждой подписки
→ 410/404 → удалить протухшую подписку
```

---

## 19. Домены: Documents (Документы)

**Типы документов:** `driver_license`, `passport`, `vehicle_docs`, `insurance`

```
POST /documents/upload (FormData: file + email + docType)
→ file → Supabase Storage make-4e36197a-documents
→ KV: ovora:doc:{email}:{docType} = { url, status: 'pending', uploadedAt }

Admin: PUT /admin/documents/:id/status { status: 'approved'|'rejected', notes }
→ KV обновляется
→ Email уведомление пользователю
→ Notification в in-app
```

---

## 20. Домены: Users & Auth

### Регистрация

```
1. EmailAuth.tsx → /email-auth
2. POST /perm-code/check-email { email } — проверка invite-кода
3. POST /users/:email (создание профиля)
4. sessionStorage: isAuthenticated=true, userRole, ovora_user_email
5. localStorage: ovora_auth_persistent { email, role }
6. navigate → /home
```

### Авторизация (повторный вход)

```
1. requireAuth() guard читает sessionStorage
2. Fallback: ovora_auth_persistent в localStorage
3. UserContext.refreshUser() → GET /users/:email
4. Кэш: localStorage['ovora_current_user']
```

### Выход

```
UserContext.logout()
→ sessionStorage.clear()
→ localStorage['ovora_current_user'] = null
→ navigate('/')
```

### OTP (одноразовый пароль)

```
POST /otp/send { email }   → генерация кода → Resend Email
POST /otp/verify { email, code } → проверка
KV: ovora:otp:{email} = { code, expiresAt: +5min }
```

### Backup Codes (2FA)

```
POST /backup/generate { email } → 8 случайных кодов → KV
POST /backup/verify { email, code } → проверка + инвалидация
GET  /backup/exists/:email → { exists: bool }
```

---

## 21. Домены: Payments

```
GET /payments/:email?role=driver|sender
→ Вычисляется из trips + offers (нет отдельной модели платежа)
→ Возвращает: [{ tripId, amount, date, counterpart, status, type }]
```

---

## 22. Домены: Ads (Реклама)

```typescript
{
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  placement: 'home' | 'search' | 'trips' | 'all';
  active: boolean;
  createdAt: string;
}
```

**Frontend:** `getPublicAds(placement?)` — загружаются на главном экране.  
**Admin:** полный CRUD + загрузка медиа в Storage.

---

## 23. Модуль Admin Panel

**URL:** `/admin/*`  
**Защита:** `X-Admin-Code` header (env: `ADMIN_ACCESS_CODE`)

### AdminAuthGate

```
Ввод кода → POST /admin/auth { code }
→ успех → sessionStorage['ovora_admin_token'] = code
→ все последующие запросы добавляют X-Admin-Code
```

### Страницы Admin

| Путь | Описание |
|------|----------|
| `/admin` | Дашборд: статистика, KPI |
| `/admin/drivers` | Управление водителями |
| `/admin/users` | Все пользователи |
| `/admin/trips` | Все рейсы |
| `/admin/offers` | Все оферты |
| `/admin/verification` | Верификация документов |
| `/admin/analytics` | Графики (Recharts) |
| `/admin/reviews` | Модерация отзывов |
| `/admin/codes` | Invite-коды (perm codes) |
| `/admin/ads` | Рекламные баннеры |
| `/admin/settings` | Настройки платформы |

---

## 24. Модуль AVIA

Полностью отдельный мини-продукт внутри Ovora.  
**Аудитория:** авиа-курьеры и отправители посылок.

### Авторизация AVIA

PIN-код (4 цифры) + телефон. Независима от основной auth.

```
POST /avia/register { phone, pin, role, ... }
POST /avia/login    { phone, pin }
→ bcrypt.compare(pin, stored_hash)
→ сессия: localStorage['ovora_avia_session'] = { user, loginAt }
```

### Роли AVIA

| Роль | Действия |
|------|----------|
| `courier` | Создаёт рейсы, принимает запросы, открывает сделки |
| `sender` | Создаёт запросы на перевозку, заключает сделки |
| `both` | Обе роли |

### Основные сущности AVIA

```typescript
AviaFlight:   { id, courierId, from, to, date, freeKg, pricePerKg, ... }
AviaRequest:  { id, senderId, from, to, date, weight, description, ... }
AviaDeal:     { id, flightId, requestId, courierId, senderId, price, status, ... }
AviaChat:     { id, participants[], messages[] }
AviaReview:   { id, fromPhone, toPhone, rating, comment, ... }
```

### Статусы сделки AVIA

```
proposed → accepted → paid → picked_up → in_transit → delivered → completed
         ↘ rejected  ↘ cancelled
```

### KV-ключи AVIA

```
ovora:avia-user:{phone}
ovora:avia-user-pin:{phone}
ovora:avia-flight:{flightId}
ovora:avia-request:{requestId}
ovora:avia-deal:{dealId}
ovora:avia-chat:{chatId}
ovora:avia-msg:{chatId}:{msgId}
ovora:avia-notif:{phone}:{notifId}
ovora:avia-review:{reviewId}
ovora:avia-pin-log:{phone}           → brute-force защита
```

### Архитектура AVIA-сервера

```
aviaRoutes.tsx  (HTTP маршруты)
    ↓ вызывает
aviaRepo.tsx    (Data Access Layer: KV операции)
    ↓
cache.tsx       (in-memory кэш с TTL)
rateLimit.tsx   (rate limiting по phone)
```

**Лимиты:**
- Login: 10 попыток → блокировка 5 минут
- PIN change: 3 попытки
- Паспорт OCR: через `OCR_SPACE_API_KEY`

---

## 25. Жизненный цикл сделки

### A. Driver Trip ↔ Sender (классическая схема)

```
┌─────────┐  1. создаёт рейс    ┌──────────┐
│ Driver  │ ─────────────────→  │   Trip   │ status: planned
└─────────┘                     └──────────┘
                                     │
                    ┌────────────────┘
┌─────────┐  2. находит рейс    │
│ Sender  │ ──────────────→ SearchResults
└─────────┘                     │
      │  3. отправляет оферту   │
      └──────────────────→ POST /offers
                                     │
                              ┌──────┴──────┐
                              │    Offer    │ status: pending
                              └──────┬──────┘
                                     │  4. создаётся чат
                                     ↓
                              ┌──────────────┐
                              │   ChatRoom   │ proposal-сообщение
                              └──────┬───────┘
                                     │  5. Driver принимает
                                     ↓
                              Offer.status = 'accepted'
                              Trip.availableSeats -= N
                                     │
                                     │  6. Driver запускает рейс
                                     ↓
                              ┌──────────────┐
                              │  Shipment    │ status: pending → ... → delivered
                              └──────────────┘
                                     │  7. Завершение
                                     ↓
                              Trip.status = 'completed'
                              Offer.status = 'accepted' (неизменно)
                              → Email + Push уведомления
                              → Форма для отзыва
```

### B. Sender Cargo ↔ Driver (обратная схема)

```
┌─────────┐  1. размещает груз  ┌──────────┐
│ Sender  │ ─────────────────→  │  Cargo   │ status: active
└─────────┘                     └──────────┘
                                     │
                    ┌────────────────┘
┌─────────┐  2. находит груз    │
│ Driver  │ ──────────────→  SearchResults?type=cargo
└─────────┘                     │
      │  3. откликается         │
      └──────────────────→ POST /cargo-offers
                                     │
                              ┌──────┴──────┐
                              │ CargoOffer  │ status: pending
                              └──────┬──────┘
                                     │  4. Sender принимает
                                     ↓
                              CargoOffer.status = 'accepted'
                              Sender видит телефон Driver
                              Driver видит телефон Sender
                                     │  5. Организация доставки
                                     ↓
                              (прямой контакт по телефону)
```

---

## 26. Кэш-стратегия

### Уровни кэша

| Уровень | Технология | TTL | Применение |
|---------|-----------|-----|------------|
| 1 | In-memory Map (dataApi) | 30–120 сек | trips, cargos, stats |
| 2 | localStorage | До сброса | trips, cargos, offers, user, chats |
| 3 | sessionStorage | Сессия | isAuthenticated, userRole, email |
| 4 | AVIA: in-memory Map | TTL по типу | пользователи, рейсы AVIA |

### Сброс кэша

```typescript
cacheClear()           // полный сброс
cacheClear('trips:')   // сброс по префиксу
_cache.delete(key)     // точечный сброс
```

### Offline-fallback

При ошибке сети компоненты читают из localStorage:
```typescript
catch {
  setTrips(JSON.parse(localStorage.getItem('ovora_published_trips') || '[]'));
}
```

### Mirror-стратегия

После каждой мутации данные немедленно применяются к localStorage:
```typescript
_mirrorTrips(data.trip, 'add' | 'update' | 'delete')
_mirrorCargos(...)
_mirrorOffers(...)
```

---

## 27. Безопасность

### Изоляция данных

Каждый запрос на мутацию включает `callerEmail`:
```typescript
// Сервер проверяет: callerEmail === resource.ownerEmail
PUT /trips/:id  { ...updates, callerEmail }
```

### Admin-защита

```
Middleware: requireAdmin(c, next)
→ c.req.header('X-Admin-Code') === Deno.env.get('ADMIN_ACCESS_CODE')
→ Применяется ко всем /admin/* и /kv/*
→ Исключение: /admin/auth (для получения токена)
```

### SERVICE_ROLE_KEY

```
SUPABASE_SERVICE_ROLE_KEY — только на сервере (Deno.env)
НИКОГДА не передаётся клиенту
Клиент использует только publicAnonKey (безопасен для публичного доступа)
```

### Rate Limiting (AVIA)

```typescript
// rateLimit.tsx — in-memory Map
RL.check(phone, 'login', { max: 10, windowMs: 5*60*1000 })
// При превышении: 429 Too Many Requests
```

### Дедупликация офертк

```
Cargo-Offers: сервер проверяет drivercargooffers:{email}:* перед созданием
Trip-Offers: проверяется по offerId (UUID)
Reviews: 409 при повторном отзыве (tripId + authorEmail)
```

---

## 28. Переменные окружения

### Сервер (Deno env)

| Переменная | Назначение |
|-----------|-----------|
| `SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_ANON_KEY` | Публичный ключ (безопасен) |
| `SUPABASE_SERVICE_ROLE_KEY` | Секретный ключ (только сервер!) |
| `SUPABASE_DB_URL` | Прямое соединение с БД |
| `ADMIN_ACCESS_CODE` | Код доступа в admin-панель |
| `RESEND_API_KEY` | API-ключ для email (Resend) |
| `GMAIL_USER` | Gmail аккаунт (fallback email) |
| `SMTP_PASS` | Пароль SMTP |
| `OCR_SPACE_API_KEY` | OCR для паспортов AVIA |
| `YANDEX_GEOCODER_API_KEY` | Геокодер Яндекс |

### Клиент (Vite env)

| Переменная | Назначение |
|-----------|-----------|
| `VITE_OPENWEATHER_API_KEY` | OpenWeatherMap для погоды |

### Защищённые файлы (не изменять!)

```
/src/app/components/figma/ImageWithFallback.tsx
/pnpm-lock.yaml
/supabase/functions/server/kv_store.tsx
/utils/supabase/info.tsx
```

---

## 29. Хуки

| Хук | Описание |
|-----|----------|
| `useIsMounted()` | Возвращает ref — защита от setState на unmounted компонент |
| `usePolling(fn, interval, enabled)` | Периодический вызов функции |
| `usePullToRefresh({ onRefresh })` | Pull-to-refresh жест (touch events) |
| `useDebounce(value, delay)` | Debounce значения |
| `useFavorites()` | CRUD избранного в localStorage |
| `useOnlineStatus()` | `navigator.onLine` + события online/offline |
| `useAvatarUpload()` | Загрузка аватара через API |
| `usePassportUpload()` | Загрузка паспорта AVIA |
| `useIntersectionObserver(ref, options)` | Lazy loading / видимость элемента |

### usePullToRefresh

```typescript
const { containerRef, pullY, isRefreshing, onTouchStart, onTouchMove, onTouchEnd }
  = usePullToRefresh({ onRefresh: () => loadData(true) });
```

Порог срабатывания: 80px вниз от верхнего края.

### usePolling

```typescript
usePolling(
  () => loadData(true),        // функция
  8000,                        // интервал мс
  document.visibilityState !== 'hidden'  // enabled
);
```

---

## 30. UI-компоненты

### Система компонентов

1. **shadcn/ui** — базовые примитивы (50+ компонентов в `/components/ui/`)
2. **lucide-react** — иконки
3. **motion/react** — анимации (бывший Framer Motion)
4. **recharts** — графики (Admin Analytics)

### Ключевые кастомные компоненты

| Компонент | Описание |
|-----------|----------|
| `TripCard` | Карточка рейса/груза (modes: search, sender, driver) |
| `TripDetail` | Детальный просмотр с вложенными компонентами |
| `MobileLayout` | Shell с нижним таб-баром + desktop sidebar |
| `ProposalCard` | Коммерческое предложение в чате |
| `SkeletonCard` | Placeholder при загрузке |
| `PullIndicator` | Анимация pull-to-refresh |
| `WeatherAnimation` | SVG-анимации погоды |
| `StarRow` | Строка со звёздами для отзывов |
| `OfflineBanner` | Баннер отсутствия интернета |
| `PushPermissionBanner` | Запрос разрешения push |
| `VoiceMessage` | Запись и воспроизведение голосовых |
| `ImageWithFallback` | Картинка с fallback (ЗАЩИЩЁННЫЙ) |

### Правило анимаций

> Background и borderColor НИКОГДА не передаются в `motion` пропсы (`initial/animate/whileHover`)  
> — `motion/react` не умеет парсить 8-значный hex (#RRGGBBAA)  
> — Используй CSS transition через `style` или `className`

```typescript
// ❌ НЕПРАВИЛЬНО
<motion.div animate={{ background: '#5ba3f514' }} />

// ✅ ПРАВИЛЬНО
<motion.div
  style={{ background: hovered ? '#5ba3f528' : '#5ba3f514',
           transition: 'background 0.2s ease' }}
/>
```

---

## 31. Важные правила и ограничения

### Импорты

```typescript
// ✅ ВСЕГДА
import { ... } from 'react-router';

// ❌ НИКОГДА
import { ... } from 'react-router-dom';
```

### Шрифты

```typescript
// ✅ ТОЛЬКО в /src/styles/fonts.css
@import url('...');

// ❌ НЕ в других CSS файлах
```

### KV-таблица

- Единственная таблица: `kv_store_4e36197a`
- Нельзя создавать новые таблицы через код (только через Supabase UI)
- DDL и миграции — запрещены в коде

### Серверные файлы

- Новые файлы сервера: только в `/supabase/functions/server/`
- Нельзя создавать новые папки внутри `server/`
- File write: только `/tmp` директория в Deno

### Производительность (50M пользователей)

```
1. In-memory кэш с TTL — снижает дублирующие запросы
2. Mirror-стратегия localStorage — мгновенный UI
3. Lazy loading маршрутов — уменьшает первый бандл
4. getByPrefix вместо getAll — точечные запросы к KV
5. Promise.allSettled для batch-запросов — не блокирует при ошибке
6. useIsMounted — предотвращает setState на unmounted (memory leak)
7. Cleanup orphaned offers — раз в 2 мин, fire-and-forget
8. Polling only when tab visible — document.visibilityState !== 'hidden'
```

### Polling-интервалы

| Контекст | Интервал |
|---------|---------|
| DriverTripsPage | 8 сек |
| SenderTripsPage | 8 сек |
| ChatPage | 3 сек |
| NotificationsPage | 10 сек |
| MobileLayout (badge) | 15 сек |
| Weather | 15 мин |

### Ключи localStorage

```
ovora_published_trips      — кэш рейсов
ovora_published_cargos     — кэш грузов
ovora_all_trips            — ВСЕ рейсы водителя
ovora_all_cargos           — ВСЕ грузы отправителя
ovora_cached_offers        — кэш офертов
ovora_current_user         — данные профиля
ovora_auth_persistent      — { email, role } для восстановления сессии
ovora_reviewed_trips       — tripId[] уже оцененных рейсов
ovora_sender_tracking_trip — данные для SenderTrackingPage
ovora_favorites            — избранные рейсы
ovora_avia_session         — AVIA-сессия
ovora_chat_{chatId}        — кэш сообщений чата
```

### Ключи sessionStorage

```
isAuthenticated      — 'true'/'false'
userRole             — 'driver'/'sender'
ovora_user_email     — email текущего пользователя
ovora_admin_token    — admin code
```

---

*Документ актуален на 03.04.2026. При изменении архитектуры обновлять соответствующие разделы.*
