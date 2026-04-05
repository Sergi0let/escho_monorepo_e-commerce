# `catalog-api` на Easypanel (Turborepo / monorepo)

Застосунок: `apps/catalog-api` (Express + `@repo/db`). Репозиторій — npm workspaces + Turbo; корінь містить `package-lock.json` і пакети в `packages/*`.

## Джерело коду

- Easypanel → сервіс типу **App** → **GitHub**, гілка (наприклад `main`).
- **Шлях збірки / Build path:** багато інсталяцій **не приймають** значення `.` як корінь; якщо є помилка валідації — спробуй **порожнє поле**, **`/`**, або шлях до апки (для нашого сетапу надійніше тримати **корінь репо** для install/build, див. нижче Nixpacks).

## Чому Nixpacks спочатку падав: немає start-команди

Nixpacks шукає `npm start` у **кореневому** `package.json`. Раніше там не було скрипта **`start`** — з’являлась помилка **No start command could be found**.

**Що зроблено в репо:**

- У **корені** `package.json`: `"start": "npm run start -w catalog-api"`.
- Файл **`nixpacks.toml`** у корені:
  - `npm ci`
  - `npx turbo run build --filter=catalog-api` (збирає лише API та залежність `@repo/db`, без Next.js store)
  - `npm run start -w catalog-api`

## Node.js версія (попередження EBADENGINE)

Nixpacks за замовчуванням тягнув **Node 18**; частина залежностей очікує **Node ≥ 20.19**.

У **`nixpacks.toml`** додано `[phases.setup]` з `nodejs_20`, `npm-10_x`, `openssl`. У корені **`package.json`** — `"engines": { "node": ">=20.19.0" }`.

## Порт, healthcheck і `SIGTERM`

Панель часто задає **`PORT`** (наприклад **80**). У коді спочатку читався лише **`CATALOG_API_PORT`** → процес слухав не той порт, healthcheck не проходив → **`SIGTERM`**.

**Що зроблено в `apps/catalog-api/src/index.ts`:**

- Порт: `process.env.PORT ?? process.env.CATALOG_API_PORT ?? "4001"`.
- Слухати на **`0.0.0.0`**: `CATALOG_API_HOST` за замовчуванням `0.0.0.0` (для Docker можна перевизначити для локалки).

У логах очікуй на кшталт: `listening on http://0.0.0.0:80`.

## Образ Docker і помилка `No such image`

Якщо білд не завершується, тег образу (наприклад `easypanel/.../service:latest`) може не існувати. Після успішного білду це зникає.

## HTTPS, редіректи й «не той» 404

- З **HTTP** часто приходить **308** на **HTTPS** — це нормально для проксі Easypanel.
- Звернення на **голий IP** по HTTPS може давати **self-signed** сертифікат — `curl` без `-k` впаде з помилкою SSL.
- HTML-сторінка **404** з брендингом Easypanel означає, що запит **не потрапив у маршрут твого сервісу** (немає прив’язки домену/роуту), а не те що Express повернув 404 для `/api/health`.

**Робоча перевірка:** додати домен (наприклад `api.example.com`) у налаштуваннях **саме цього** App → `GET https://api.example.com/api/health` → `{"ok":true}`.

## Попередження Docker при білді: секрети

Якщо `TELEGRAM_BOT_TOKEN` потрапляє в **ARG/ENV шару образу**, Docker попереджає **SecretsUsedInArgOrEnv**. Краще тримати такі змінні лише як **runtime env** сервісу в панелі, без участі в етапі `docker build`, де це можливо.

## Змінні середовища `catalog-api`

Мінімум:

| Змінна | Опис |
|--------|------|
| `DATABASE_URL` | Postgres (внутрішній URL для контейнера API) |
| `PORT` | часто задає Easypanel автоматично |

За потреби:

- `CATALOG_API_PORT` — якщо не використовується тільки `PORT`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — для POST `/api/orders`
- `CATALOG_API_HOST` — локально інколи `127.0.0.1`

## Корисні команди (локально, перед пушем)

Перевірка збірки лише API:

```bash
npm ci
npx turbo run build --filter=catalog-api
npm run start -w catalog-api
```

## Пов’язані документи

- Postgres: [deployment-easypanel-postgres.md](./deployment-easypanel-postgres.md)
- Імпорт даних: [deployment-catalog-import.md](./deployment-catalog-import.md)
