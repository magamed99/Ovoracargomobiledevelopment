# Cloudflare — защита ovora-cargo.ru от DDoS

Пошаговая инструкция. Бесплатный тариф Cloudflare, ничего не ломает существующий деплой (GitHub Pages остаётся хостингом — Cloudflare просто встаёт перед ним).

---

## Шаг 1 — регистрация и добавление сайта

1. Зайти на [cloudflare.com](https://cloudflare.com) → Sign Up (бесплатно).
2. **Add a Site** → ввести `ovora-cargo.ru` → выбрать план **Free**.
3. Cloudflare просканирует текущие DNS-записи домена и покажет их список — ничего не менять на этом шаге, просто **Continue**.

## Шаг 2 — сменить NS-серверы у регистратора домена

Cloudflare покажет два NS-сервера вида `xxx.ns.cloudflare.com` и `yyy.ns.cloudflare.com`.

1. Зайти в панель управления регистратора, где куплен `ovora-cargo.ru`.
2. Найти раздел **NS-серверы / Nameservers**.
3. Заменить текущие NS-серверы на те два, что дал Cloudflare.
4. Сохранить. Обновление занимает от 10 минут до 24 часов (обычно быстрее).

Cloudflare сам пришлёт email, когда домен активируется.

## Шаг 3 — проверить DNS-записи после активации

В Cloudflare → **DNS** → **Records** должны быть записи, указывающие на GitHub Pages:

```
Type   Name    Content                    Proxy status
A      @       185.199.108.153            Proxied (оранжевое облако)
A      @       185.199.109.153            Proxied
A      @       185.199.110.153            Proxied
A      @       185.199.111.153            Proxied
CNAME  www     magamed99.github.io        Proxied
```

**Важно:** для всех записей должно быть включено **Proxied** (оранжевое облако), не "DNS only" (серое) — иначе Cloudflare не встаёт перед трафиком и защита не работает.

## Шаг 4 — включить защиту

1. **SSL/TLS** → режим **Full** (не Flexible — иначе будет редирект-луп с GitHub Pages, у которого свой HTTPS).
2. **Security** → **Bots** → включить **Bot Fight Mode** (бесплатно, режет ботов автоматически).
3. **Security** → **Settings** → **Security Level** → поставить **Medium** или **High**.
4. **Speed** → **Caching** → **Caching Level: Standard** — снижает нагрузку на GitHub Pages при всплеске трафика (статика будет отдаваться из кэша Cloudflare).

## Шаг 5 (опционально, но полезно) — Rate Limiting Rule

Free-тариф даёт немного бесплатных правил:
1. **Security** → **WAF** → **Rate limiting rules** → Create rule.
2. Например: если с одного IP больше 60 запросов за 10 секунд на любой путь — блокировать на 1 минуту.

## Что это даёт

- Атаки уровня L3/L4 (флуд пакетами/SYN-флуд) гасятся на границе сети Cloudflare, даже не доходя до GitHub Pages.
- Bot Fight Mode отсеивает автоматизированных ботов ещё до статики.
- Кэш статики снижает эффективность L7-флуда (запросы на главную страницу отдаются из кэша, не долетая до origin).

## Чего это НЕ закрывает

Backend (Supabase Edge Functions, `*.supabase.co`) остаётся напрямую доступен — Cloudflare перед доменом `ovora-cargo.ru` не проксирует запросы к Supabase API (они идут с фронтенда напрямую на supabase.co, не через ваш домен). Для защиты бэкенда используются:
- Cloudflare Turnstile на формах регистрации/логина/OTP (реализовано в коде, см. `TURNSTILE_SETUP.md`)
- Rate limiting внутри самого бэкенда (`rateLimit.tsx`)
