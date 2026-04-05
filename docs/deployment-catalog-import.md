# Наповнення БД: таблиці (Prisma) та товари (`catalog-import`)

Два окремі кроки: спочатку **схема** (таблиці під Prisma і `catalog-api`), потім **імпорт XML/YML** через `packages/catalog-import`.

## Передумови

- PostgreSQL уже працює (наприклад на Easypanel).
- `DATABASE_URL` веде на **ту саму** базу, яку використовує **`catalog-api`**.
- З **ноутбука** потрібен **зовнішній** доступ до Postgres (IP:порт і credentials з панелі), якщо не запускаєш команди всередині мережі Docker.

Приклад (заміни на свої значення):

```bash
export DATABASE_URL='postgresql://USER:PASSWORD@SERVER_IP:5432/dbname?sslmode=disable'
```

Де взяти хост і порт:

- Easypanel → сервіс **PostgreSQL** → зовнішній / опублікований хост і порт або рядок підключення для клієнтів «ззовні».
- Внутрішній hostname на кшталт `project_service-db` з домашнього ПК **зазвичай не працює**.

## Крок 1 — таблиці (`prisma db push`)

У **корені** репозиторію:

```bash
cd /шлях/до/xmlConverterToDb
npm ci
DATABASE_URL='postgresql://...' npm run db:push -w @repo/db
```

Успіх:

```text
Your database is now in sync with your Prisma schema.
```

Це створює/оновлює таблиці з `packages/db/prisma/schema.prisma`.  
Окремої папки `prisma/migrations` у проєкті немає; для продакшену з історією змін можна пізніше перейти на `prisma migrate`.

Якщо Postgres скаржиться на UUID:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

(один раз, через клієнта SQL.)

## Крок 2 — товари з фіду (XML)

Формат фіду: **Yandex Market YML** — деталі в [catalog-imports.md](./catalog-imports.md).

Збірка пакета і імпорт одного файлу:

```bash
cd /шлях/до/xmlConverterToDb

npm run build -w @xml-converter/catalog-import

DATABASE_URL='postgresql://...' \
  node packages/catalog-import/scripts/import-feed.mjs /повний/шлях/до/фіду.xml
```

Альтернатива через npm-скрипт workspace:

```bash
DATABASE_URL='postgresql://...' \
  npm run import:feed -w @xml-converter/catalog-import -- /повний/шлях/до/фіду.xml
```

У консолі з’явиться JSON на кшталт:

```json
{
  "categoriesUpserted": 24,
  "productsUpserted": 35,
  "colorsUpserted": 197,
  "skusUpserted": 649,
  "warnings": []
}
```

## Нюанс: `type "gender" does not exist`

- Після **`db push`** Prisma створює ENUM у Postgres як **`"Gender"`** (ім’я зі схеми Prisma).
- Старий SQL `001_init.sql` і початковий код імпорту використовували тип **`gender`**.
- У `packages/catalog-import/src/persist.ts` каст узгоджено з Prisma: `$5::"Gender"` (див. поточний код у репо).

Якщо базу піднімав **лише** через `001_init.sql` без Prisma — тип може лишатися `gender`; тоді ситуація інша (одне джерело правди краще не змішувати).

## Кілька фідів підряд

```bash
export DATABASE_URL='postgresql://...'

for f in ~/feeds/*.xml; do
  echo "=== $f ==="
  node packages/catalog-import/scripts/import-feed.mjs "$f"
done
```

Upsert у БД оновлює існуючі записи за ключами (`group_key`, `barcode` тощо). Якщо в двох фідах однакові коди від різних постачальників — можливі колізії.

## Перевірка після імпорту

- HTTP API: наприклад `GET https://api.your-domain.com/api/categories/nav`
- Локально Prisma Studio (обережно на проді):  
  `DATABASE_URL='...' npx prisma studio --schema packages/db/prisma/schema.prisma`

## Безпека

Не коміть `.env` з прод-паролями. Після прикладів у чатах/логах варто **ротувати пароль** Postgres у панелі.

## Пов’язані документи

- Доменна логіка імпорту: [catalog-imports.md](./catalog-imports.md)
- Postgres на Easypanel: [deployment-easypanel-postgres.md](./deployment-easypanel-postgres.md)
