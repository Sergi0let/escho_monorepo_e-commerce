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

| Змінна         | Опис                                         |
| -------------- | -------------------------------------------- |
| `DATABASE_URL` | Postgres (внутрішній URL для контейнера API) |
| `PORT`         | часто задає Easypanel автоматично            |

За потреби:

- `CATALOG_API_PORT` — якщо не використовується тільки `PORT`
- `ADMIN_API_KEY` — секрет для заголовка `X-API-Key` на мутаціях `POST/PATCH /api/admin/*` (див. [catalog-api-instruction.md](./catalog-api-instruction.md))
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — для POST `/api/orders`
- `CATALOG_API_HOST` — локально інколи `127.0.0.1`
- `CATALOG_API_VERBOSE_ERRORS` — тимчасово `1` або `true`: у відповідях **500** додаватимуться `detail` і за наявності `code` (наприклад Prisma); лише для діагностики, після зняття логів вимкни

## Білд на Easypanel, runtime і `DATABASE_URL`

### Що відбувається при білді (Nixpacks / Turbo)

1. **`npm ci`** — ставляться залежності.
2. **`npx turbo run build --filter=catalog-api`** тягне **`@repo/db:build`**: там викликається **`prisma generate`** за [schema.prisma](../packages/db/prisma/schema.prisma) — це лише **оголошення Prisma Client** у `node_modules`, без обов’язкових запитів до твоєї Postgres.
3. У **`nixpacks.toml`** **немає** `prisma db push` і міграцій — тобто білд означає **«зібрати код»**, а не **«підключитися до прод-БД і вирівняти таблиці»**.

**Живе з’єднання** з віддаленою БД (наприклад `postgres://…@213…`) для **успішного білду не обов’язкове**; воно може знадобитися лише якщо ти **свідомо** дась крок білду, який ходить у БД.

### Коли реально використовується `DATABASE_URL`

- У **runtime**: після **`npm run start -w catalog-api`** контейнер слухає порти; коли приходить запит, який йде в Prisma, клієнт відкриває пул до Postgres за **`DATABASE_URL`**, заданою в Easypanel (**Env / Secrets** для цього App).
- Якщо **`DATABASE_URL`** порожня або невірна: **`GET /api/health`** може бути `{"ok":true}`, а **`GET /api/health/ready`** або будь-який маршрут з БД — помилка (наприклад **503** на ready).

### Що Easypanel не робить автоматично

- **Не виконує** **`prisma db push`** / міграції проти твоєї БД після кожного деплою, поки ти не додаси це в скрипт білду, CI або не запустиш окремо.
- **Вирівнювання схеми** (нові колонки, enum тощо) — окремий крок: зазвичай **локально або в CI** з тим самим `DATABASE_URL`, що й на проді (див. команди нижче).

**Коротко:** білд збирає застосунок; **підключення до Postgres** — у **роботі контейнера** через **`DATABASE_URL` у панелі**; **оновлення структури БД** — **окремо**, не «автоматично разом з білдом», якщо це явно не підключено.

## Команди Prisma в цьому репо (коли що запускати)

Усі команди з кореня монорепо; **`DATABASE_URL`** має вказувати на **ту БД**, з якою працюєш (локальна `.env` або `export DATABASE_URL=…` перед командою).

| Команда | Коли запускати | Що робить |
| -------- | --------------- | ---------- |
| **`npm run db:generate -w @repo/db`** | Після змін у **`packages/db/prisma/schema.prisma`**, після оновлення Prisma, або якщо «клієнт застарів» перед **`tsc` / білдом**. На CI — перед `turbo build`, якщо генеруєш не через turbo. | `prisma generate`: оновлює Prisma Client і типи. **До БД не підключається.** На Easypanel під час білду це вже входить у **`@repo/db:build`**. |
| **`npm run db:push -w @repo/db`** | Коли треба **застосувати поточну схему** до конкретної Postgres (створити/змінити таблиці та колонки). **Після змін у `schema.prisma`** і перед релізом API, якщо прод-БД має відповідати репо. Увага: на проді запускай свідомо з **прод `DATABASE_URL`**. | `prisma db push` з кореня з `--schema=packages/db/prisma/schema.prisma` (як у скрипті пакета). **Змінює БД**; міграційної історії в репо немає — це push-модель. |
| **`npx prisma db execute --stdin --schema=packages/db/prisma/schema.prisma <<< "SELECT 1"`** | Швидка **перевірка з’єднання** і прав доступу без змін схеми; перед **`db push`**, при діагностиці мережі/SSL (shell bash/zsh). | Виконує SQL через Prisma; при успіху БД «жива». |

Альтернатива перевірки без SQL у stdin: **`GET …/api/health/ready`** на задеплоєному **catalog-api** (там теж виконується запит до БД через Prisma).

## Healthcheck і 500 після деплою

- **`GET /api/health`** — процес Express живий.
- **`GET /api/health/ready`** — `SELECT 1` через Prisma. **503** з `database: down` означає проблему **`DATABASE_URL`** (для Docker має бути **внутрішній** хост Postgres у мережі Easypanel, не `127.0.0.1` з твого ПК), SSL (`?sslmode=require`), тощо.

Якщо `/api/health` ок, а інші маршрути повертають **`{"error":"Internal error"}`**:

1. **БД не синхронізована** з `schema.prisma` — на проді виконай `prisma db push` з тим самим `DATABASE_URL`, що в сервісі (або міграції). Часто це відсутня колонка (`feed_shop_name` тощо); з `CATALOG_API_VERBOSE_ERRORS` у відповіді з’явиться текст помилки Postgres/Prisma.
2. **Enum `gender` у Postgres** не збігається з Prisma (`@@map("gender")` у репо) — узгодь тип у БД або онови схему.
3. Увімкни **`CATALOG_API_VERBOSE_ERRORS=true`**, рестарт сервісу, повтори запит і/або дивись **логи контейнера** — рядки `[catalog-api:…]` містять повну помилку.

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
