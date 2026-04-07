# Інструкція: catalog-api (локально, admin API, деплой на Easypanel)

## Що це за сервіс

**catalog-api** (`apps/catalog-api`) — Express-сервер з маршрутами для вітрини (читання каталогу), оформлення замовлень (Telegram) і **адмінських** операцій зміни категорій/товарів у БД.

Структура коду:

- `src/index.ts` — завантаження `.env`, старт HTTP.
- `src/app.ts` — `cors`, `express.json()`, підключення роутів.
- `src/routes/` — окремі модулі: `health`, `orders`, `categories`, `products`, `admin` (+ `admin-categories`, `admin-products`).
- `src/middleware/require-api-key.ts` — захист **тільки** для `/api/admin/*`.
- `src/utils/env-config.ts` — фільтри списків, режим «картка = колір» (`CATALOG_CARD_GRANULARITY`).
- `src/order-telegram.ts` — відправка замовлення в Telegram.

## Змінні середовища (мінімум)

| Змінна | Де потрібна | Призначення |
|--------|-------------|-------------|
| `DATABASE_URL` | корінь `.env`, процес API | PostgreSQL для Prisma |
| `PORT` або `CATALOG_API_PORT` | API | Порт прослуховування (на Easypanel часто задає панель як `PORT`) |
| `CATALOG_API_HOST` | опційно | За замовчуванням `0.0.0.0` (докер/прод) |
| `ADMIN_API_KEY` | API | Секрет для заголовка `X-API-Key` на маршрутах `/api/admin/*` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | API | POST `/api/orders` у Telegram |
| `CATALOG_CARD_GRANULARITY` | API | `color` або інше для гріду |

Без **`ADMIN_API_KEY`** усі запити на `/api/admin/*` отримують **401** (ключ має бути заданий у проді, якщо використовуєш admin API).

Файли, які **підхоплює** `catalog-api` при старті (у порядку завантаження; `apps/catalog-api/.env.local` **перекриває** значення з кореня): корінь `.env` / `.env.local`, `apps/store/.env.local`, `apps/catalog-api/.env`, **`apps/catalog-api/.env.local`**.

Публічні **GET** (`/api/products`, `/api/categories/...`) і **POST `/api/orders`** ключ **не потребують**.

## Публічні ендпоінти (як у вітрини)

- `GET /api/health` — перевірка живості.
- `GET /api/categories/nav`, `/api/categories/:id`, товари по категорії тощо.
- `GET /api/products`, `/api/products/count`, `/api/products/detail/:id`, `/api/products/:id/colors`, `/api/catalog/filter-options`, тощо.
- `POST /api/orders` — тіло замовлення (як раніше); при відсутності Telegram у `.env` можлива відповідь у demo-режимі.

## Admin API (мутації БД)

Усі під шляхом **`/api/admin/...`** з заголовком:

```http
X-API-Key: <те саме значення, що ADMIN_API_KEY>
```

| Метод | Шлях | Тіло (приклад) |
|--------|------|----------------|
| `POST` | `/api/admin/categories` | `{"id": 12345, "name": "Назва", "parent_id": null}` — `id` обов'язковий (як у фіду), без автоінкременту. |
| `PATCH` | `/api/admin/categories/:id` | `{"name": "..."}` і/або `{"parent_id": null}` або число. |
| `PATCH` | `/api/admin/products/:id` | UUID товару в URL; у body частково: `title`, `description`, `brand`, `fabric`, `country`, `product_kind`, `feed_shop_name`, `category_id`, `gender` (`male` \| `female` \| `unisex` \| `unknown`). |

Помилки Prisma: дубль категорії **409** (`P2002`), не знайдено **404** (`P2025`).

### Приклади `curl`

```bash
export API=https://your-api.example.com
export KEY=your-secret-admin-key

curl -sS "$API/api/health"

curl -sS -X PATCH "$API/api/admin/products/UUID-ТОВАРУ" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $KEY" \
  -d '{"title":"Нова назва"}'
```

### Швидко тестити нові маршрути локально

1. **Підійми API** (з кореня репо): `npm run dev -w catalog-api`  
   Переконайся, що в **кореневому** `.env` є `DATABASE_URL`, а для admin-ешндпоінтів — **`ADMIN_API_KEY`** (довільний секретний рядок).

2. **Заголовок для admin:** кожен `POST/PATCH` під `/api/admin/...` потребує  
   `X-API-Key: <те саме, що в ADMIN_API_KEY>`.

3. **Готові запити у редакторі:** файл **[apps/catalog-api/api-local.http](../apps/catalog-api/api-local.http)**  
   Відкрий у **Cursor / VS Code**, встанови розширення [**REST Client**](https://marketplace.visualstudio.com/items?itemName=humao.rest-client), підстав у `api-local.http` реальний `@key` і **UUID товару** з відповіді `GET …/api/products`. Натискай «Send Request» над кожним блоком.

4. **Альтернативи:** Postman / Insomnia / Bruno — імпортуй ті самі URL, методи, заголовки і JSON; або копіюй **`curl`** із прикладів вище, змінюючи `localhost` і порт (`4001` / твій `CATALOG_API_PORT`).

## Локальна розробка

З кореня монорепозиторію:

```bash
npm ci
npm run dev -w catalog-api
# або
npx turbo dev --filter=catalog-api
```

Переконайся, що Postgres доступний за `DATABASE_URL`. Збірка:

```bash
npx turbo run build --filter=catalog-api
npm run start -w catalog-api
```

У пакеті `@repo/db` `prisma generate` викликається з кореня репо (див. `packages/db/package.json`) — не запускай `prisma generate` лише з `packages/db`, якщо отримуєш помилку про `@prisma/client`.

Докладніше про стек: [architecture.md](./architecture.md).

---

## Деплой на **Easypanel** (правильно)

Нижче — узгоджено з репозиторієм (Nixpacks, turbo, `PORT`). Повний розбір див. **[deployment-easypanel-catalog-api.md](./deployment-easypanel-catalog-api.md)**.

### 1. Сервіс у панелі

- Тип **App** → джерело **Git**, гілка (наприклад `main`).
- **Build / root**: корінь репозиторію (де `package-lock.json`, `nixpacks.toml`). Якщо поле «шлях» свариться — спробуй порожньо, `/`, або корінь репо за підказками панелі.

### 2. Збірка та старт (уже в репо)

У корені є **`nixpacks.toml`**: `npm ci` → `npx turbo run build --filter=catalog-api` → **`npm run start -w catalog-api`**.

У кореневому **`package.json`**: `"start": "npm run start -w catalog-api"`, щоб Nixpacks знайшов команду старту.

Node: **≥ 20.19** (див. `engines` і фазу `setup` у `nixpacks.toml`).

### 3. Змінні в Easypanel (Runtime)

Обов’язково:

- **`DATABASE_URL`** — внутрішній URL Postgres у тій самій мережі Docker/Easypanel (не `127.0.0.1` хост-машини, якщо БД в іншому контейнері).
- **`PORT`** — якщо панель задає порт автоматично; код читає `PORT` **перед** `CATALOG_API_PORT`.

Додатково за потреби:

- **`ADMIN_API_KEY`** — для admin API; значення лише в секретах панелі, не в ARG збірки.
- **`TELEGRAM_BOT_TOKEN`**, **`TELEGRAM_CHAT_ID`** — для замовлень.
- Решта прапорів каталогу (`CATALOG_CARD_GRANULARITY`, імпорт недоступних SKU тощо) — як у кореневому `.env.example`.

### 4. Healthcheck і домен

- Health: **`GET /api/health`** → `{"ok":true}`.
- У налаштуваннях **саме цього** App прив’яжи домен (наприклад `api.yourdomain.com`); перевіряй по **HTTPS** з цього домену, а не лише по IP (див. пояснення про 404/HTML Easypanel у [deployment-easypanel-catalog-api.md](./deployment-easypanel-catalog-api.md)).

### 5. Store / Admin на фронті

- **Вітрина (Next)** у змінних вкажи **публічний URL** цього API (`CATALOG_API_URL` / `NEXT_PUBLIC_...`).
- Секрет **`ADMIN_API_KEY`** у браузер **не вставляй**; для майбутніх форм у admin UI використовуй **серверний** проксі або виклики лише з довіреного середовища.

### 6. Безпека

- Токени Telegram і **`ADMIN_API_KEY`** тримай у **змінних середовища** сервісу в Easypanel (runtime), не прошивай у образ при білді, щоб зменшити попередження Docker про секрети в шарах образу.

---

Пов’язані документи: [deployment-easypanel-catalog-api.md](./deployment-easypanel-catalog-api.md), [deployment-easypanel-postgres.md](./deployment-easypanel-postgres.md).
