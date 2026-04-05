# Вітрина `apps/store` на Vercel

Next.js 15 у монорепо (npm workspaces). Пакет **`catalog-store`** не залежить від `@repo/db` напряму — тільки від HTTP API (`catalog-api`).

## Підключення репозиторію

1. [Vercel](https://vercel.com) → **Add New Project**.
2. Імпорт GitHub-репозиторію, гілка (наприклад `main`).

## Root Directory

**Root Directory:** `apps/store`

(Налаштування проєкту: *Settings → General → Root Directory*.)

## Install Command (обов’язково для monorepo)

`package-lock.json` лежить у **корені** монорепо. Якщо Vercel виконає `npm install` лише в `apps/store`, збірка часто падає.

У **Settings → General** вистав:

| Поле | Значення |
|------|----------|
| **Install Command** | `cd ../.. && npm ci` |
| **Build Command** | залишити за замовчуванням (`next build`) або `npm run build` |

Після install Vercel збирає проєкт у контексті `apps/store`; Node резолвить залежності з кореневого `node_modules` workspace.

## Змінні середовища

**Settings → Environment Variables** (Production і за потреби Preview):

| Name | Приклад значення |
|------|-------------------|
| `NEXT_PUBLIC_CATALOG_API_URL` | `https://api.example.com` |
| `CATALOG_API_URL` | `https://api.example.com` (той самий базовий URL **без** слешу в кінці) |

Навіщо дві:

- `NEXT_PUBLIC_*` потрапляє в бандл для браузера (как клієнтські `fetch` у `catalog-client.ts`).
- `CATALOG_API_URL` — для серверних маршрутів (наприклад проксі замовлення на `catalog-api`).

**`DATABASE_URL` на Vercel не потрібен** — БД лише на боці `catalog-api`.

## Версія Node

У **Settings → General → Node.js Version** обери **20.x** (узгоджено з `engines.node` у кореневому `package.json`).

## Після деплою

1. Відкрий виданий домен Vercel (`*.vercel.app` або свій).
2. Перевір головну, категорії, товар.
3. Оформи тестове замовлення — сервер має діставатися до `https://api...` без блокування CORS (на `catalog-api` увімкнено `cors({ origin: true })`).

## Перевірка API з боку Vercel

Якщо сторінки порожні або 502 на `/api/send-order`:

- Чи збігаються URL у env (HTTPS, без зайвого `/`).
- Чи `catalog-api` і домен API доступні з інтернету (`/api/health`).

## Корисні команди локально

```bash
cd apps/store
cp .env.local.example .env.local
# CATALOG_API_URL=http://127.0.0.1:4001 для локального API

npm run dev
```

## Пов’язані документи

- API на Easypanel: [deployment-easypanel-catalog-api.md](./deployment-easypanel-catalog-api.md)
- Наповнення каталогу: [deployment-catalog-import.md](./deployment-catalog-import.md)
