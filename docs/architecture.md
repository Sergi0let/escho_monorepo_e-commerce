# Архітектура репозиторію

Коротка замітка про те, як зібраний проєкт після впровадження **Turborepo**, окремого **catalog-api** та **Prisma**.

## Монорепо

- **Менеджер пакетів і workspace:** npm (`package.json` у корені, поле `workspaces`).
- **Оркестрація задач:** [Turborepo](https://turbo.build) — `turbo.json`.
- **З кореня:** `npm install`, `npm run dev`, `npm run build`, `npm run db:generate` тощо.

Задача `dev` у turbo має `dependsOn: ["^build"]`: перед стартом dev-скриптів збираються **залежні** workspace-пакети (наприклад, `@repo/db` перед `catalog-api`).

## Пакети та застосунки

| Шлях | Назва (npm) | Призначення |
|------|-------------|-------------|
| `apps/store` | `catalog-store` | Клієнтський магазин на **Next.js** (App Router). Каталог тягне через **HTTP**, не через прямий доступ до БД. |
| `apps/catalog-api` | `catalog-api` | **Express** REST API каталогу. Єдиний шар читання каталогу з БД для вітрини (легко винести окремо, масштабувати, додати інших клієнтів). |
| `packages/db` | `@repo/db` | **Prisma 6.19.x** (версії зафіксовані без `^`): `schema.prisma` з `url` у `datasource`, клієнт, логіка в **`catalog-service`**. Розширення редактора під Prisma 7 може показувати хибні попередження про `url` — орієнтуйтесь на залежості пакета. Перехід на Prisma 7 потребує Node **≥ 20.19** і окремої міграції (`prisma.config.ts`, driver adapter). |
| `packages/catalog-import` | `@xml-converter/catalog-import` | Імпорт YML/XML у Postgres (окремий пайплайн; зараз не обов’язково через Prisma). |

## Потік даних каталогу

```
Браузер → Next.js (apps/store)
              ↓ fetch (catalog-client)
         catalog-api (Express)
              ↓ Prisma (@repo/db)
         PostgreSQL
```

- У сторі модулі **`apps/store/src/lib/catalog-client.ts`** формують URL з `CATALOG_API_URL` / `INTERNAL_CATALOG_API_URL` (fallback: `http://127.0.0.1:4001`) і викликають `GET /api/...` на `catalog-api`.
- **`apps/store/src/lib/queries.ts`** лишається фасадом: реекспорт типів і функцій для мінімальних змін у імпортах компонентів/сторінок.
- Реалізація запитів до БД живе в **`packages/db/src/catalog-service.ts`** (Prisma + сирі SQL там, де потрібні рекурсивні CTE тощо).
- Маршрути Express описані в **`apps/catalog-api/src/index.ts`**.

## Що лишилось «всередині» Next (без catalog-api)

Маршрути **`apps/store/src/app/api/**`** (наприклад, Нова Пошта, `send-order`) — це BFF/edge-логіка домену магазину (пошта, листи), **не** публічний каталог БД. Їх можна з часом теж винести в окремий сервіс, якщо знадобиться єдиний gateway.

## Змінні оточення (орієнтир)

| Змінна | Де | Навіщо |
|--------|-----|--------|
| `DATABASE_URL` | корінь `.env`, середовище `catalog-api` | Підключення Postgres для Prisma / імпорту |
| `CATALOG_API_URL` | `apps/store` (наприклад `.env.local`) | Базовий URL для `catalog-client` |
| `CATALOG_API_PORT` | опційно для `catalog-api` | Порт сервера (типово `4001`) |

Приклади — у **`.env.example`** у корені репо.

## Локальний запуск

1. Підняти Postgres і задати `DATABASE_URL`.
2. З кореня: `npm install`, далі `npm run dev` — паралельно підуть процеси з `dev` у workspace (зокрема стор і catalog-api, з урахуванням `^build` для залежностей).

Якщо стор стартує без доступного `catalog-api`, сторінки каталогу можуть падати на `fetch`; хедер частково обгорнутий у `try/catch`, але повноцінна робота вимагає живого API.

## Подальші напрями (за потреби)

- Версіонування API (`/v1/...`), захист (rate limit, API keys) на `catalog-api`.
- Спільні **DTO/типи** між store і api через пакет `@repo/contracts` або OpenAPI codegen.
- Єдиний кореневий **Docker Compose** для `store` + `catalog-api` + Postgres.
