# 🔌 Рекомендуемые MCP-серверы для Ovora Cargo

Подобрано под наш стек: **React 18 + Vite + Tailwind + Supabase Edge Functions (Deno/Hono) + Supabase KV + GitHub Pages + Sentry**.
Отобраны самые популярные и поддерживаемые MCP (по звёздам GitHub и активности).
Цель — чтобы ИИ-ассистент (MiMo / Claude) работал с проектом «на уровне сеньора»: видел БД, логи, доки, тестировал в браузере.

> Звёзды указаны на момент составления (июнь 2026), могут меняться.

---

## 🥇 Приоритет 1 — ставить обязательно (прямо под наш проект)

### 1. Supabase MCP — БД, логи, edge-функции
Весь backend, KV Store, Storage, Auth, Edge Functions — это Supabase. Даёт ИИ читать логи функции, выполнять SQL, смотреть таблицы, проверять security-advisors.
- **Пакет (официальный):** `@supabase/mcp-server-supabase`
- **Установка:** `npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=mkbcjxnoeevtkzaqcpsh`
- ⚠️ Только с **`--read-only`** токеном (доступ к прод-БД!). Токен: Supabase Dashboard → Account → Access Tokens.
- *Почему №1:* без него ИИ работает вслепую по коду; с ним видит живой backend (та самая ошибка `/avia/flights` нашлась бы за минуты по логам).

### 2. Context7 — свежая документация библиотек (⭐ 58k)
Актуальные доки React 18 / Vite 6 / Tailwind v4 / React Router v7 / Hono — чтобы ИИ не путал устаревшие API.
- **Repo:** `upstash/context7`
- **Установка:** `npx -y @upstash/context7-mcp@latest`

### 3. GitHub MCP — PR, issues, CI/CD (официальный)
Управление PR, проверка статусов GitHub Actions (деплой на Pages), ревью.
- **Repo:** `github/github-mcp-server` (официальный, Go)
- **Установка:** через Docker / бинарь + `GITHUB_PERSONAL_ACCESS_TOKEN` (scope: repo, workflow)

### 4. Playwright MCP — тестирование PWA в браузере (⭐ ~13k)
Открыть ovora-cargo.ru, проверить вёрстку/адаптив на мобайле и десктопе, сделать скриншот, поймать ошибки в консоли. Закрывает «я не вижу результат на экране».
- **Repo (официальный, Microsoft):** `microsoft/playwright-mcp`
- **Установка:** `npx -y @playwright/mcp@latest`

---

## 🥈 Приоритет 2 — сильно помогают

### 5. Sentry MCP — мониторинг ошибок
В проекте уже подключён Sentry (`VITE_SENTRY_DSN`). MCP даёт ИИ читать реальные ошибки пользователей из прода и чинить их адресно.
- **Repo:** `getsentry/sentry-mcp`
- **Установка:** `npx -y @sentry/mcp-server@latest`

### 6. shadcn/ui MCP — UI-компоненты
В проекте есть `src/app/components/ui/*` (shadcn). MCP даёт ИИ ставить/смотреть компоненты по стандарту.
- **Установка:** `npx -y shadcn@latest mcp` (встроено в shadcn CLI)

### 7. Figma MCP — дизайн → код (официальный)
Если макеты в Figma — генерировать экраны из дизайна 1-в-1.
- Официальный **Figma Dev Mode MCP** (в десктоп-приложении Figma) или Figma MCP server.

---

## 🥉 Приоритет 3 — база от MCP-команды (официальные)

Из `modelcontextprotocol/servers`:
- **Filesystem** — `@modelcontextprotocol/server-filesystem` (работа с файлами)
- **Sequential Thinking** — `@modelcontextprotocol/server-sequential-thinking` (структурное рассуждение для сложных задач)
- **Fetch** — `@modelcontextprotocol/server-fetch` (тянуть веб-страницы)

Каталог проверенных серверов: `appcypher/awesome-mcp-servers` (⭐ 5.6k), официальный реестр `modelcontextprotocol/registry`.

---

## 🧠 Промпты/правила для MiMo (чтобы работал как сеньор)

Помимо MCP, задать ассистенту системные правила (в `AGENT.md` или конфиг):

```
1. НИКОГДА не пушь в main напрямую — только ветка + PR.
2. Перед коммитом: npm run typecheck И npm run build — оба зелёные.
3. Сначала ЧИТАЙ код/логи (Supabase MCP), потом правь — не гадай.
4. При «не грузится/ошибка» — смотри РЕАЛЬНЫЙ текст в браузере (Playwright MCP)
   или логи (Supabase MCP), а не предполагай по коду.
5. callerEmail/callerPhone обязателен во write-операциях; role/status/codeHash не трогать.
6. Переводы — сразу ru+tj+en. Один PR = одна задача.
7. Деплой в прод (мердж в main) — только с разрешения человека.
```

---

## Итог — минимальный набор «под ключ» для нашего сайта
Если ставить только 4 — то эти:
1. **Supabase MCP** (`--read-only`) — видеть БД/логи/функции
2. **Context7** — свежие доки стека
3. **Playwright MCP** — проверять сайт глазами
4. **GitHub MCP** — PR/CI

Этого достаточно, чтобы ассистент перестал работать вслепую и резко поднял качество.
