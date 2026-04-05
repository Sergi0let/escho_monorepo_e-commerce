# Імпорт каталогу з YML/XML у PostgreSQL

Пакет: [`packages/catalog-import`](../packages/catalog-import/). Він читає фіди у форматі **Yandex Market YML** (`yml_catalog` → `shop` → `categories` + `offers`), нормалізує дані й зберігає їх у PostgreSQL так, щоб на клієнті можна було показати **один товар із кількома кольорами та розмірами** (кожен розмір/колір у фіді — окремий `offer` і окремий рядок `skus` з унікальним `barcode`).

---

## Загальний потік

```mermaid
flowchart LR
  subgraph read [Читання]
    XML[Файл або Readable]
    SAX[SAX saxes]
    XML --> SAX
  end
  subgraph domain [Домен]
    Cat[Мапа категорій]
    Norm[Нормалізація оферів]
    Graph[Групування group_id]
    Gender[Визначення статі]
    SAX --> Cat
    SAX --> Norm
    Norm --> Graph
    Cat --> Graph
    Cat --> Gender
    Graph --> Gender
  end
  subgraph db [База]
    Pg[(PostgreSQL)]
    Gender --> Pg
  end
```

1. **Парсер** стрімінгово читає XML, накопичує **категорії**, потім віддає **батчі оферів** (щоб не тримати весь файл в пам’яті).
2. Кожен офер **нормалізується** (ціни, URL картинок, витяг кольору/розміру з `param`, ОГ/ОТ/ОС).
3. Офери з однаковим **`group_id`** збираються в **один логічний продукт**; всередині — **варіанти кольору** та **SKU** (розмір + штрихкод).
4. **`persistImport`** робить upsert у таблиці (категорії → продукти → кольори → SKU).

---

## Формат вхідного XML (що очікується)

Типовий фрагмент структури:

- `<categories>` — елементи `<category id="..." parentId="...">Назва</category>`.
- `<offers>` — елементи `<offer id="..." group_id="..." available="...">` з дочірніми тегами:
  - `price`, `currencyId`, `categoryId`, `vendorCode`, `picture` (може бути кілька), `barcode`, `name`, `name_ua`, `description`, `description_ua`, `vendor`, `stock_quantity`, `article`;
  - **`old_price`** або **`oldprice`** (обидва підтримуються);
  - `<param name="Колір">...</param>`, `<param name="Розмір">...</param>`, тощо;
  - опційно **`<ОГ>`**, **`<ОТ>`**, **`<ОС>`** (обхвати в см на рівень конкретного офера/SKU).

Один XML-**offer** після імпорту відповідає **одному рядку в `skus`**; ключ оновлення — **`barcode`**.

---

## Модуль 1: парсер (`parser.ts`)

- Бібліотека: **`saxes`** (події `opentag`, `closetag`, `text`, `cdata`).
- Читання: **файл** (`createReadStream`) або **`Readable`**.
- Спочатку в мапу потрапляють усі **категорії**; після початку `offers` збираються **офери** з вкладених полів (для кожного `offer` використовується внутрішній стек вкладених тегів).

### Публічні функції

| Функція | Призначення |
|--------|-------------|
| `parseYmlCatalogBatches(source, options)` | Асинхронно парсить файл; опційно `onBatch({ offers, shopName })` викликається пакетами; повертає `{ categories, shopName, offerCount }`. |
| `parseYmlCatalogFull(source)` | Збирає **всі** офери в масив (зручно для тестів і невеликих файлів). |

### Важливо: мапа категорій для колбеків

Якщо в `onBatch` потрібно будувати граф одразу під час парсу, передай **ту саму** мапу в опції:

```ts
categories?: Map<bigint, CategoryRow>;
```

Інакше `categories` з результату `await` ще не існуватиме на момент першого батчу. Пакет **імпортера** це робить автоматично.

### Приклад: лише парсинг, без БД

```ts
import { parseYmlCatalogFull } from '@xml-converter/catalog-import';

const { categories, shopName, offers } = await parseYmlCatalogFull('/шлях/до/feed.xml');
console.log('Категорій:', categories.size, 'Оферів:', offers.length, 'Магазин:', shopName);
```

---

## Модуль 2: нормалізація (`normalize.ts`)

| Правило | Поведінка |
|--------|-----------|
| **Картинки** `http://crm.newtrend.team/...` | У `upgradeImageUrlsToHttps` протокол змінюється на `https`. |
| **Стара ціна** | Збирається з `old_price` **або** `oldprice`. Якщо відсутня — **`oldPrice = price`**. |
| **Некоректні знижки** | Якщо у фіді `price > oldPrice`, викликається опційний callback **`onPriceWarning`**, а `oldPrice` піднімається до **`max(price, oldPrice)`**, щоб виконати інваріант знижки. |
| **Колір / розмір / бренд / тканина / країна / вид** | З `param` за іменами на кшталт `Колір`, `Розмір`, `Бренд`, `Тканина`, `Країна-виробник`, `Вид виробу`. |
| **ОГ/ОТ/ОС** | З тегів або з `param` з іменами на кшталт `ог`, `от`, `ос`. |

```ts
import { normalizeOffer, upgradeImageUrlsToHttps, normalizePrices } from '@xml-converter/catalog-import';

const urls = upgradeImageUrlsToHttps(['http://crm.newtrend.team/media/shop/test.jpg']);
const { price, oldPrice } = normalizePrices('100', '120', undefined, 'offer-1', console.warn);
// normalized = normalizeOffer(rawOffer, 'New Trend', onWarning);
```

---

## Модуль 3: стать (`gender.ts`)

У фіді окремого поля «чоловіче/жіноче» зазвичай немає. **`inferGender`** дивиться на **ланцюжок назв категорій** від `categoryId` офера до кореня, потім на резервний текст (назва, опис, `vendorCode`).

Результат: enum **`male` | `female` | `unisex` | `unknown`**.

Корисні допоміжні функції: **`getCategoryNameChain`**, логіка патернів на кшталт `жіноч`, `чоловіч`, `унісекс`.

---

## Модуль 4: граф товарів (`graph.ts`)

- **Ключ групи** (`group_key` у БД): значення **`group_id`** з XML. Якщо немає — евристика з **`vendorCode`** (база з сегментів до останніх двох через `_`) або ключ **`solo:{offerId}`**.
- Усередині групи офери діляться за **назвою кольору** (з нормалізованого `param`), для кожного кольору збираються **URL зображень** і масив **SKU**.

Стрімінговий імпорт з кількох батчів **зливає** частини одного й того ж `group_key` через **`mergeBuiltProducts`**.

```ts
import { buildProductGraph, normalizeOffer } from '@xml-converter/catalog-import';

const normalized = rawOffers.map((o) => normalizeOffer(o, shopName));
const products = buildProductGraph(normalized, categories);
```

---

## Модуль 5: PostgreSQL (`persist.ts` + міграція)

Файл міграції: [`packages/catalog-import/migrations/001_init.sql`](../packages/catalog-import/migrations/001_init.sql).

### Таблиці (логіка)

- **`categories`** — `id` з фіду, `parent_id`, `name`. Upsert у порядку «батько перед дитиною» (**`sortCategoriesForInsert`**).
- **`products`** — логічний товар: `group_key` UNIQUE, `title`, `description`, `category_id`, **`gender`**, `brand`, `fabric`, `country`, `product_kind`, `feed_shop_name`.
- **`product_colors`** — колір варіанту: `product_id`, `color_name`, `sort_order`, `image_urls` (масив тексту).
- **`skus`** — один рядок на штрихкод: `barcode` UNIQUE, зв’язок з продуктом і кольором, розмір, ціни, наявність, запас, **ОГ/ОТ/ОС** у см.

Обмеження: **`CHECK (price <= old_price)`** на `skus`.

### Приклад programmatic імпорту

```ts
import pg from 'pg';
import {
  parseYmlCatalogFull,
  normalizeOffer,
  buildProductGraph,
  persistImport,
  withWarnings,
} from '@xml-converter/catalog-import';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });

const warnings: import('@xml-converter/catalog-import').PriceWarning[] = [];
const { categories, shopName, offers } = await parseYmlCatalogFull('./feed.xml');
const normalized = offers.map((o) =>
  normalizeOffer(o, shopName || 'Feed', (w) => warnings.push(w)),
);
const products = buildProductGraph(normalized, categories);
const result = withWarnings(
  await persistImport(pool, { categories, products }),
  warnings,
);
console.log(result);
await pool.end();
```

---

## Фасад імпортера: `createCatalogImporter` (`importer.ts`)

Рекомендований шлях для **адмінки / cron / Express / Nest / Next** один раз отримує **`Pool`**, далі:

- **`importFromFile(path)`**
- **`importFromReadable(stream)`** (наприклад, завантажений файл з `multipart`)

Всередині: стрімінговий парс з **`onBatch`**, нормалізація, **`mergeBuiltProducts`**, потім **`persistImport`**.

```ts
import pg from 'pg';
import { createCatalogImporter } from '@xml-converter/catalog-import';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const importer = createCatalogImporter(pool, {
  offerBatchSize: 500,
  onPriceWarning: (w) => console.warn(w),
});

const summary = await importer.importFromFile('/var/uploads/last-feed.xml');
// summary: { categoriesUpserted, productsUpserted, colorsUpserted, skusUpserted, warnings }
```

### CLI з репозиторію

З каталогу `packages/catalog-import` після **`npm run build`**:

```bash
DATABASE_URL='postgresql://catalog:catalog@127.0.0.1:5436/catalog' \
  npm run import:feed -- ../../feeds/159.xml
```

Або:

```bash
DATABASE_URL='...' node scripts/import-feed.mjs /абсолютний/шлях/до/фіду.xml
```

Пояснення полів відповіді JSON:

- **`categoriesUpserted`** — скільки рядків категорій upsert’нуто;
- **`productsUpserted`** — скільки логічних продуктів (унікальних `group_key`);
- **`colorsUpserted`** / **`skusUpserted`** — скільки записів у `product_colors` / `skus` оброблено в цій транзакції імпорту;
- **`warnings`** — події нормалізації бір (наприклад `price_gt_old`).

---

## Локальна база (Docker)

Корінь репо: [`docker-compose.yml`](../docker-compose.yml) піднімає PostgreSQL. Якщо на хості порт **5432** зайнятий, у файлі зазвичай мапінг **`HOST:5432`** (наприклад `5436:5432`) — у **`DATABASE_URL` треба вказати саме HOST-порт**.

Застосування схеми (приклад):

```bash
docker compose exec -T postgres psql -U catalog -d catalog < packages/catalog-import/migrations/001_init.sql
```

---

## Що робити з даними після імпорту (вивід на клієнт)

Дані вже структуровані під UI «**кнопки кольору + список розмірів**»:

1. **Картка товару** — `products` за `id` або за стабільним **`group_key`**.
2. **Кольори** — `product_colors` для цього `product_id` (`image_urls[0]` — прев’ю кнопки).
3. **Розміри та ціна** — `skus` для обраного `product_color_id`: `size_label`, `price`, `old_price`, `available`, `barcode`.

Фільтрація каталогу: по **`products.gender`**, **`category_id`**, **`brand`**, **`fabric`**, **`country`**, **`product_kind`**, по коліру/розміру через join з **`skus`** / **`product_colors`**, по наявності — **`skus.available`** (або `stock_quantity` за правилом бізнесу).

Реалізація: окремий **HTTP API** (Express / Nest / Next Route Handler), який виконує SQL з `JOIN` і віддає JSON для фронту — прямого доступу браузера до Postgres не потрібно.

---

## Збірка та тести пакета

```bash
cd packages/catalog-import
npm install
npm run build
npm test
npm run lint
```

Юніт-тести використовують малі фікстури XML у `src/fixtures/`; повні фіди можна проганяти через CLI на реальну БД.

---

## Короткий покажчик файлів

| Файл | Роль |
|------|------|
| `src/parser.ts` | SAX, категорії, батчі оферів |
| `src/normalize.ts` | Ціни, HTTPS, param, ОГ/ОТ/ОС |
| `src/gender.ts` | `inferGender` |
| `src/graph.ts` | Дерево продукт → колір → SKU |
| `src/persist.ts` | Upsert у PostgreSQL |
| `src/importer.ts` | `createCatalogImporter` |
| `scripts/import-feed.mjs` | CLI |
| `migrations/001_init.sql` | Схема БД |

---

## Next.js-вітрина (`apps/store`) — **Є що**

Окремий застосунок **каталог + кошик + оформлення (демо)** на Next.js 15 (App Router), підключення до **того ж** Postgres через `DATABASE_URL`. UI на базі **shadcn/ui-патерну** (Radix: `DropdownMenu`, `Button`, `Card`, `Badge`) + токени у `globals.css`, іконки **lucide-react**.

### Запуск

```bash
cd apps/store
cp .env.local.example .env.local
# Вкажіть той самий DATABASE_URL, що й для Docker/імпорту

npm install
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000).

### Сторінки

| Маршрут | Що робить |
|---------|-----------|
| `/` | Головна: чіпси категорій + сітка товарів; у **шапці** випадаюче меню «Категорії» з БД |
| `/category/[id]` | Товари з `category_id` (id з таблиці `categories`) |
| `/product/[uuid]` | Картка товару: колір, розмір, додавання в кошик |
| `/cart` | Кошик (лічильник у шапці) |
| `/checkout` | Демо-форма; після відправки кошик очищається |

### Кошик

Стан зберігається в **Zustand** з **`persist`** (localStorage, ключ `catalog-boutique-cart`). Сервер БД для кошика не використовується.

### Залежність від даних

Потрібно хоч раз **імпортувати фід** у ту саму базу (див. CLI `import-feed`). Якщо таблиці порожні, на сайті відобразяться порожні блоки.
