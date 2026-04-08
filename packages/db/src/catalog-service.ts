import { Prisma } from "@prisma/client";
import type {
  CatalogFilterOptions,
  CatalogListFilters,
  CategoryRow,
  ColorWithSkus,
  ProductColorCardItem,
  ProductDetail,
  ProductListItem,
  SkuJson,
} from "./dto.js";
import { prisma } from "./client.js";

/**
 * У проді зазвичай на вітрині лише товари з хоча б одним SKU available=true.
 * Для розробки: CATALOG_INCLUDE_UNAVAILABLE_PRODUCTS=true — списки й лічильники по всіх products.
 */
function listingMode(): "stocked" | "all" {
  return process.env.CATALOG_INCLUDE_UNAVAILABLE_PRODUCTS === "true"
    ? "all"
    : "stocked";
}

function listingWhereClause(): Prisma.Sql {
  const hasColor = Prisma.sql`EXISTS (
    SELECT 1 FROM product_colors pc WHERE pc.product_id = p.id
  )`;
  const hasStockedSku = Prisma.sql`EXISTS (
    SELECT 1 FROM skus s WHERE s.product_id = p.id AND s.available
  )`;

  return listingMode() === "all"
    ? hasColor
    : Prisma.sql`${hasColor} AND ${hasStockedSku}`;
}

function normalizeCatalogFilters(
  f: CatalogListFilters | undefined,
): CatalogListFilters {
  if (!f) return {};
  const color = f.color?.trim() || undefined;
  const size = f.size?.trim() || undefined;
  let priceMin = f.priceMin;
  let priceMax = f.priceMax;
  if (priceMin !== undefined && (!Number.isFinite(priceMin) || priceMin < 0)) {
    priceMin = undefined;
  }
  if (priceMax !== undefined && (!Number.isFinite(priceMax) || priceMax < 0)) {
    priceMax = undefined;
  }
  if (
    priceMin !== undefined &&
    priceMax !== undefined &&
    priceMin > priceMax
  ) {
    const t = priceMin;
    priceMin = priceMax;
    priceMax = t;
  }
  return {
    ...(color ? { color } : {}),
    ...(size ? { size } : {}),
    ...(priceMin !== undefined ? { priceMin } : {}),
    ...(priceMax !== undefined ? { priceMax } : {}),
  };
}

function skuPriceAvailabilitySql(): Prisma.Sql {
  return listingMode() === "all" ? Prisma.sql`TRUE` : Prisma.sql`s_pf.available`;
}

/** EXISTS: у товару p є SKU з ціною в діапазоні. */
function productPriceFilterExists(filters: CatalogListFilters): Prisma.Sql | null {
  const f = normalizeCatalogFilters(filters);
  if (f.priceMin === undefined && f.priceMax === undefined) return null;
  const avail = skuPriceAvailabilitySql();
  if (f.priceMin !== undefined && f.priceMax !== undefined) {
    return Prisma.sql`EXISTS (
      SELECT 1 FROM skus s_pf
      WHERE s_pf.product_id = p.id AND ${avail}
        AND s_pf.price >= ${f.priceMin} AND s_pf.price <= ${f.priceMax}
    )`;
  }
  if (f.priceMin !== undefined) {
    return Prisma.sql`EXISTS (
      SELECT 1 FROM skus s_pf
      WHERE s_pf.product_id = p.id AND ${avail}
        AND s_pf.price >= ${f.priceMin}
    )`;
  }
  return Prisma.sql`EXISTS (
    SELECT 1 FROM skus s_pf
    WHERE s_pf.product_id = p.id AND ${avail}
      AND s_pf.price <= ${f.priceMax!}
  )`;
}

/** EXISTS: у кольору pc є SKU з ціною в діапазоні. */
function colorCardPriceFilterExists(filters: CatalogListFilters): Prisma.Sql | null {
  const f = normalizeCatalogFilters(filters);
  if (f.priceMin === undefined && f.priceMax === undefined) return null;
  const avail = skuPriceAvailabilitySql();
  if (f.priceMin !== undefined && f.priceMax !== undefined) {
    return Prisma.sql`EXISTS (
      SELECT 1 FROM skus s_pf
      WHERE s_pf.product_color_id = pc.id AND ${avail}
        AND s_pf.price >= ${f.priceMin} AND s_pf.price <= ${f.priceMax}
    )`;
  }
  if (f.priceMin !== undefined) {
    return Prisma.sql`EXISTS (
      SELECT 1 FROM skus s_pf
      WHERE s_pf.product_color_id = pc.id AND ${avail}
        AND s_pf.price >= ${f.priceMin}
    )`;
  }
  return Prisma.sql`EXISTS (
    SELECT 1 FROM skus s_pf
    WHERE s_pf.product_color_id = pc.id AND ${avail}
      AND s_pf.price <= ${f.priceMax!}
  )`;
}

function combineAnd(parts: Prisma.Sql[]): Prisma.Sql {
  if (parts.length === 0) return Prisma.sql`TRUE`;
  if (parts.length === 1) return parts[0]!;
  return Prisma.sql`(${Prisma.join(parts, " AND ")})`;
}

/** Додаткові умови по коліру/розміру для рядка products p. */
function productListFilterClause(filters: CatalogListFilters): Prisma.Sql {
  const f = normalizeCatalogFilters(filters);
  const parts: Prisma.Sql[] = [];
  if (f.color) {
    parts.push(Prisma.sql`EXISTS (
      SELECT 1 FROM product_colors pc_f
      WHERE pc_f.product_id = p.id AND pc_f.color_name = ${f.color}
    )`);
  }
  if (f.size) {
    if (listingMode() === "all") {
      parts.push(Prisma.sql`EXISTS (
        SELECT 1 FROM skus s_f
        WHERE s_f.product_id = p.id AND TRIM(s_f.size_label) = ${f.size}
      )`);
    } else {
      parts.push(Prisma.sql`EXISTS (
        SELECT 1 FROM skus s_f
        WHERE s_f.product_id = p.id AND s_f.available
          AND TRIM(s_f.size_label) = ${f.size}
      )`);
    }
  }
  const pf = productPriceFilterExists(filters);
  if (pf !== null) parts.push(pf);
  return combineAnd(parts);
}

/** Додаткові умови для картки кольору pc. */
function colorCardFilterClause(filters: CatalogListFilters): Prisma.Sql {
  const f = normalizeCatalogFilters(filters);
  const parts: Prisma.Sql[] = [];
  if (f.color) {
    parts.push(Prisma.sql`pc.color_name = ${f.color}`);
  }
  if (f.size) {
    if (listingMode() === "all") {
      parts.push(Prisma.sql`EXISTS (
        SELECT 1 FROM skus s_f
        WHERE s_f.product_color_id = pc.id AND TRIM(s_f.size_label) = ${f.size}
      )`);
    } else {
      parts.push(Prisma.sql`EXISTS (
        SELECT 1 FROM skus s_f
        WHERE s_f.product_color_id = pc.id AND s_f.available
          AND TRIM(s_f.size_label) = ${f.size}
      )`);
    }
  }
  const cf = colorCardPriceFilterExists(filters);
  if (cf !== null) parts.push(cf);
  return combineAnd(parts);
}

function categorySubtreeCte(categoryId: bigint): Prisma.Sql {
  return Prisma.sql`
    WITH RECURSIVE subtree AS (
      SELECT id FROM categories WHERE id = ${categoryId}
      UNION ALL
      SELECT c.id FROM categories c
      INNER JOIN subtree st ON c.parent_id = st.id
    )`;
}

function productInCategorySubtree(): Prisma.Sql {
  return Prisma.sql`p.category_id IN (SELECT id FROM subtree)`;
}

function productListPriceFromSql(): Prisma.Sql {
  return listingMode() === "all"
    ? Prisma.sql`(SELECT MIN(s2.price)::text FROM skus s2 WHERE s2.product_id = p.id)`
    : Prisma.sql`(SELECT MIN(s2.price)::text FROM skus s2 WHERE s2.product_id = p.id AND s2.available)`;
}

function productListSelectSql(): Prisma.Sql {
  const pf = productListPriceFromSql();
  return Prisma.sql`
       p.id::text AS id,
       p.title,
       ${pf} AS price_from,
       (SELECT pc.image_urls[1]
        FROM product_colors pc
        WHERE pc.product_id = p.id
        ORDER BY pc.sort_order
        LIMIT 1) AS thumb,
       p.gender::text AS gender,
       p.product_kind`;
}

function featuredProductListSql(): Prisma.Sql {
  const pf =
    listingMode() === "all"
      ? Prisma.sql`(SELECT MIN(s.price)::text FROM skus s WHERE s.product_id = p.id)`
      : Prisma.sql`(SELECT MIN(s.price)::text FROM skus s WHERE s.product_id = p.id AND s.available)`;
  return Prisma.sql`
       p.id::text AS id,
       p.title,
       ${pf} AS price_from,
       (SELECT pc.image_urls[1]
        FROM product_colors pc
        WHERE pc.product_id = p.id
        ORDER BY pc.sort_order
        LIMIT 1) AS thumb,
       p.gender::text AS gender,
       p.product_kind,
       p.updated_at`;
}

type ProductListWithUpdated = ProductListItem & { updated_at: Date };

function stripUpdated(r: ProductListWithUpdated): ProductListItem {
  const { updated_at: _u, ...rest } = r;
  return rest;
}

export async function getRootCategories(limit = 24): Promise<CategoryRow[]> {
  const rows = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    parent_id: null,
  }));
}

export async function getNavChildCategories(
  limit = 80,
): Promise<CategoryRow[]> {
  const roots = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true },
  });
  if (!roots.length) return [];
  const rootIds = roots.map((r) => r.id);
  const rows = await prisma.category.findMany({
    where: { parentId: { in: rootIds } },
    orderBy: { name: "asc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    parent_id: r.parentId?.toString() ?? null,
  }));
}

export async function getStorefrontNavCategories(
  limit = 80,
): Promise<CategoryRow[]> {
  const children = await getNavChildCategories(limit);
  if (children.length > 0) return children;
  return getRootCategories(limit);
}

export async function getCategoryById(id: bigint): Promise<CategoryRow | null> {
  const c = await prisma.category.findUnique({ where: { id } });
  if (!c) return null;
  return {
    id: c.id.toString(),
    name: c.name,
    parent_id: c.parentId?.toString() ?? null,
  };
}

export async function countStockedProducts(
  filters: CatalogListFilters = {},
): Promise<number> {
  const base = listingWhereClause();
  const fc = productListFilterClause(filters);
  const rows = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint AS c FROM products p
    WHERE ${base} AND ${fc}`;
  const n = rows[0]?.c;
  return typeof n === "bigint" ? Number(n) : Number(n ?? 0);
}

export async function getStockedProductsPage(
  limit: number,
  offset: number,
  filters: CatalogListFilters = {},
): Promise<ProductListItem[]> {
  const base = listingWhereClause();
  const fc = productListFilterClause(filters);
  return prisma.$queryRaw<ProductListItem[]>(
    Prisma.sql`
     SELECT ${productListSelectSql()}
     FROM products p
     WHERE ${base} AND ${fc}
     ORDER BY p.updated_at DESC, p.id
     LIMIT ${limit} OFFSET ${offset}
    `,
  );
}

export async function countProductsByCategory(
  categoryId: bigint,
  filters: CatalogListFilters = {},
): Promise<number> {
  const base = listingWhereClause();
  const fc = productListFilterClause(filters);
  const rows = await prisma.$queryRaw<{ c: bigint }[]>`
     WITH RECURSIVE subtree AS (
    SELECT id FROM categories WHERE id = ${categoryId}
    UNION ALL
    SELECT c.id FROM categories c
    INNER JOIN subtree st ON c.parent_id = st.id
  )
     SELECT COUNT(*)::bigint AS c
     FROM products p
     WHERE p.category_id IN (SELECT id FROM subtree) AND ${base} AND ${fc}`;
  const n = rows[0]?.c;
  return typeof n === "bigint" ? Number(n) : Number(n ?? 0);
}

export async function getFeaturedProductsBalanced(
  limit = 12,
): Promise<ProductListItem[]> {
  const stocked = listingWhereClause();
  const featuredSql = featuredProductListSql();
  const perGender = Math.max(1, Math.ceil(limit / 3));

  const male = await prisma.$queryRaw<ProductListWithUpdated[]>`
    SELECT ${featuredSql}
     FROM products p
     WHERE p.gender = 'male' AND ${stocked}
     ORDER BY p.updated_at DESC
     LIMIT ${perGender}`;
  const female = await prisma.$queryRaw<ProductListWithUpdated[]>`
    SELECT ${featuredSql}
     FROM products p
     WHERE p.gender = 'female' AND ${stocked}
     ORDER BY p.updated_at DESC
     LIMIT ${perGender}`;
  const other = await prisma.$queryRaw<ProductListWithUpdated[]>`
    SELECT ${featuredSql}
     FROM products p
     WHERE p.gender IN ('unisex', 'unknown') AND ${stocked}
     ORDER BY p.updated_at DESC
     LIMIT ${perGender}`;

  const merged = [...male, ...female, ...other]
    .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
    .map(stripUpdated);

  const seen = new Set(merged.map((p) => p.id));
  if (merged.length >= limit) return merged.slice(0, limit);

  const need = limit - merged.length;
  const seenArr = Array.from(seen);

  let filler: ProductListWithUpdated[] = [];
  if (seenArr.length === 0) {
    filler = await prisma.$queryRaw<ProductListWithUpdated[]>`
    SELECT ${featuredSql}
     FROM products p
     WHERE ${stocked}
     ORDER BY p.updated_at DESC
     LIMIT ${need}`;
  } else {
    filler = await prisma.$queryRaw<ProductListWithUpdated[]>`
    SELECT ${featuredSql}
     FROM products p
     WHERE ${stocked}
       AND p.id::text NOT IN (${Prisma.join(seenArr)})
     ORDER BY p.updated_at DESC
     LIMIT ${need}`;
  }

  return [...merged, ...filler.map(stripUpdated)];
}

export async function getProductsByCategory(
  categoryId: bigint,
  limit = 48,
  offset = 0,
  filters: CatalogListFilters = {},
): Promise<ProductListItem[]> {
  const base = listingWhereClause();
  const fc = productListFilterClause(filters);
  return prisma.$queryRaw<ProductListItem[]>`
  WITH RECURSIVE subtree AS (
    SELECT id FROM categories WHERE id = ${categoryId}
    UNION ALL
    SELECT c.id FROM categories c
    INNER JOIN subtree st ON c.parent_id = st.id
  )
     SELECT ${productListSelectSql()}
     FROM products p
     WHERE p.category_id IN (SELECT id FROM subtree) AND ${base} AND ${fc}
     ORDER BY p.updated_at DESC, p.id
     LIMIT ${limit} OFFSET ${offset}`;
}

function colorCardSkuExistsSql(): Prisma.Sql {
  return listingMode() === "all"
    ? Prisma.sql`EXISTS (SELECT 1 FROM skus s WHERE s.product_color_id = pc.id)`
    : Prisma.sql`EXISTS (SELECT 1 FROM skus s WHERE s.product_color_id = pc.id AND s.available)`;
}

function colorCardPriceFromSql(): Prisma.Sql {
  return listingMode() === "all"
    ? Prisma.sql`(SELECT MIN(s.price)::text FROM skus s WHERE s.product_color_id = pc.id)`
    : Prisma.sql`(SELECT MIN(s.price)::text FROM skus s WHERE s.product_color_id = pc.id AND s.available)`;
}

function colorCardSelectSql(): Prisma.Sql {
  const pf = colorCardPriceFromSql();
  return Prisma.sql`
       pc.id::text AS id,
       p.id::text AS product_id,
       p.title,
       pc.color_name,
       ${pf} AS price_from,
       pc.image_urls[1] AS thumb,
       p.gender::text AS gender,
       p.product_kind`;
}

/** Кількість «карток» = рядків product_colors з принаймні одним релевантним SKU. */
export async function countColorCards(
  filters: CatalogListFilters = {},
): Promise<number> {
  const ex = colorCardSkuExistsSql();
  const fc = colorCardFilterClause(filters);
  const rows = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint AS c
    FROM product_colors pc
    INNER JOIN products p ON p.id = pc.product_id
    WHERE ${ex} AND ${fc}`;
  const n = rows[0]?.c;
  return typeof n === "bigint" ? Number(n) : Number(n ?? 0);
}

export async function getColorCardsPage(
  limit: number,
  offset: number,
  filters: CatalogListFilters = {},
): Promise<ProductColorCardItem[]> {
  const ex = colorCardSkuExistsSql();
  const fc = colorCardFilterClause(filters);
  return prisma.$queryRaw<ProductColorCardItem[]>`
     SELECT ${colorCardSelectSql()}
     FROM product_colors pc
     INNER JOIN products p ON p.id = pc.product_id
     WHERE ${ex} AND ${fc}
     ORDER BY p.updated_at DESC, pc.sort_order, pc.id
     LIMIT ${limit} OFFSET ${offset}`;
}

export async function countColorCardsByCategory(
  categoryId: bigint,
  filters: CatalogListFilters = {},
): Promise<number> {
  const ex = colorCardSkuExistsSql();
  const fc = colorCardFilterClause(filters);
  const rows = await prisma.$queryRaw<{ c: bigint }[]>`
     WITH RECURSIVE subtree AS (
    SELECT id FROM categories WHERE id = ${categoryId}
    UNION ALL
    SELECT c.id FROM categories c
    INNER JOIN subtree st ON c.parent_id = st.id
  )
     SELECT COUNT(*)::bigint AS c
     FROM product_colors pc
     INNER JOIN products p ON p.id = pc.product_id
     WHERE p.category_id IN (SELECT id FROM subtree)
       AND ${ex} AND ${fc}`;
  const n = rows[0]?.c;
  return typeof n === "bigint" ? Number(n) : Number(n ?? 0);
}

export async function getColorCardsByCategory(
  categoryId: bigint,
  limit = 48,
  offset = 0,
  filters: CatalogListFilters = {},
): Promise<ProductColorCardItem[]> {
  const ex = colorCardSkuExistsSql();
  const fc = colorCardFilterClause(filters);
  return prisma.$queryRaw<ProductColorCardItem[]>`
  WITH RECURSIVE subtree AS (
    SELECT id FROM categories WHERE id = ${categoryId}
    UNION ALL
    SELECT c.id FROM categories c
    INNER JOIN subtree st ON c.parent_id = st.id
  )
     SELECT ${colorCardSelectSql()}
     FROM product_colors pc
     INNER JOIN products p ON p.id = pc.product_id
     WHERE p.category_id IN (SELECT id FROM subtree)
       AND ${ex} AND ${fc}
     ORDER BY p.updated_at DESC, pc.sort_order, pc.id
     LIMIT ${limit} OFFSET ${offset}`;
}

async function getPriceBoundsForScope(
  categoryId: bigint | null,
  listByColor: boolean,
): Promise<{ min: number; max: number } | null> {
  const inCat: Prisma.Sql =
    categoryId === null ? Prisma.sql`TRUE` : productInCategorySubtree();
  const stockSku =
    listingMode() === "all" ? Prisma.sql`TRUE` : Prisma.sql`s.available`;

  const rows = listByColor
    ? categoryId
      ? await prisma.$queryRaw<{ lo: number | null; hi: number | null }[]>`
          ${categorySubtreeCte(categoryId)}
          SELECT MIN(s.price)::float8 AS lo, MAX(s.price)::float8 AS hi
          FROM skus s
          INNER JOIN product_colors pc ON pc.id = s.product_color_id
          INNER JOIN products p ON p.id = pc.product_id
          WHERE ${inCat} AND ${colorCardSkuExistsSql()} AND ${stockSku}`
      : await prisma.$queryRaw<{ lo: number | null; hi: number | null }[]>`
          SELECT MIN(s.price)::float8 AS lo, MAX(s.price)::float8 AS hi
          FROM skus s
          INNER JOIN product_colors pc ON pc.id = s.product_color_id
          INNER JOIN products p ON p.id = pc.product_id
          WHERE ${colorCardSkuExistsSql()} AND ${stockSku}`
    : categoryId
      ? await prisma.$queryRaw<{ lo: number | null; hi: number | null }[]>`
          ${categorySubtreeCte(categoryId)}
          SELECT MIN(s.price)::float8 AS lo, MAX(s.price)::float8 AS hi
          FROM skus s
          INNER JOIN products p ON p.id = s.product_id
          WHERE ${inCat} AND ${listingWhereClause()} AND ${stockSku}`
      : await prisma.$queryRaw<{ lo: number | null; hi: number | null }[]>`
          SELECT MIN(s.price)::float8 AS lo, MAX(s.price)::float8 AS hi
          FROM skus s
          INNER JOIN products p ON p.id = s.product_id
          WHERE ${listingWhereClause()} AND ${stockSku}`;

  const lo = rows[0]?.lo;
  const hi = rows[0]?.hi;
  if (lo == null || hi == null || !Number.isFinite(lo) || !Number.isFinite(hi)) {
    return null;
  }
  const min = Math.floor(lo);
  const max = Math.ceil(hi);
  if (min > max) return null;
  return { min, max: Math.max(min, max) };
}

/**
 * Унікальні коліри та розміри для випадаючих фільтрів (узгоджено з поточним режимом карток).
 * `listByColor`: true — опції як для карток по кольору; false — по product.
 */
export async function getCatalogFilterOptions(
  categoryId: bigint | null,
  listByColor: boolean,
): Promise<CatalogFilterOptions> {
  const inCat: Prisma.Sql =
    categoryId === null ? Prisma.sql`TRUE` : productInCategorySubtree();

  if (listByColor) {
    const colorRows = categoryId
      ? await prisma.$queryRaw<{ v: string }[]>`
      ${categorySubtreeCte(categoryId)}
      SELECT DISTINCT pc.color_name AS v
      FROM product_colors pc
      INNER JOIN products p ON p.id = pc.product_id
      WHERE ${inCat} AND ${colorCardSkuExistsSql()}
      ORDER BY v`
      : await prisma.$queryRaw<{ v: string }[]>`
      SELECT DISTINCT pc.color_name AS v
      FROM product_colors pc
      INNER JOIN products p ON p.id = pc.product_id
      WHERE ${colorCardSkuExistsSql()}
      ORDER BY v`;

    const sizeRows = categoryId
      ? await prisma.$queryRaw<{ v: string }[]>`
      ${categorySubtreeCte(categoryId)}
      SELECT DISTINCT TRIM(s.size_label) AS v
      FROM skus s
      INNER JOIN product_colors pc ON pc.id = s.product_color_id
      INNER JOIN products p ON p.id = pc.product_id
      WHERE TRIM(COALESCE(s.size_label, '')) <> ''
        AND ${inCat}
        AND ${colorCardSkuExistsSql()}
      ORDER BY v`
      : await prisma.$queryRaw<{ v: string }[]>`
      SELECT DISTINCT TRIM(s.size_label) AS v
      FROM skus s
      INNER JOIN product_colors pc ON pc.id = s.product_color_id
      INNER JOIN products p ON p.id = pc.product_id
      WHERE TRIM(COALESCE(s.size_label, '')) <> ''
        AND ${colorCardSkuExistsSql()}
      ORDER BY v`;

    const price_range = await getPriceBoundsForScope(categoryId, true);
    return {
      colors: colorRows.map((r) => r.v),
      sizes: sizeRows.map((r) => r.v),
      price_range,
    };
  }

  const baseList = listingWhereClause();
  const colorRows = categoryId
    ? await prisma.$queryRaw<{ v: string }[]>`
    ${categorySubtreeCte(categoryId)}
    SELECT DISTINCT pc.color_name AS v
    FROM product_colors pc
    INNER JOIN products p ON p.id = pc.product_id
    WHERE ${inCat} AND ${baseList}
    ORDER BY v`
    : await prisma.$queryRaw<{ v: string }[]>`
    SELECT DISTINCT pc.color_name AS v
    FROM product_colors pc
    INNER JOIN products p ON p.id = pc.product_id
    WHERE ${baseList}
    ORDER BY v`;

  const sizeStockClause =
    listingMode() === "all"
      ? Prisma.sql`TRUE`
      : Prisma.sql`s.available`;
  const sizeRows = categoryId
    ? await prisma.$queryRaw<{ v: string }[]>`
    ${categorySubtreeCte(categoryId)}
    SELECT DISTINCT TRIM(s.size_label) AS v
    FROM skus s
    INNER JOIN products p ON p.id = s.product_id
    WHERE TRIM(COALESCE(s.size_label, '')) <> ''
      AND ${inCat}
      AND ${baseList}
      AND ${sizeStockClause}
    ORDER BY v`
    : await prisma.$queryRaw<{ v: string }[]>`
    SELECT DISTINCT TRIM(s.size_label) AS v
    FROM skus s
    INNER JOIN products p ON p.id = s.product_id
    WHERE TRIM(COALESCE(s.size_label, '')) <> ''
      AND ${baseList}
      AND ${sizeStockClause}
    ORDER BY v`;

  const price_range = await getPriceBoundsForScope(categoryId, false);
  return {
    colors: colorRows.map((r) => r.v),
    sizes: sizeRows.map((r) => r.v),
    price_range,
  };
}

export async function getProductById(
  productId: string,
): Promise<ProductDetail | null> {
  const rows = await prisma.$queryRaw<ProductDetail[]>`
    SELECT
       p.id::text AS id,
       p.title,
       p.description,
       p.gender::text AS gender,
       p.brand,
       p.fabric,
       p.country,
       p.product_kind,
       p.feed_shop_name,
       p.category_id::text AS category_id,
       c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ${productId}::uuid
     LIMIT 1`;
  return rows[0] ?? null;
}

export async function getProductColorsWithSkus(
  productId: string,
): Promise<ColorWithSkus[]> {
  const rows = await prisma.$queryRaw<
    {
      id: string;
      color_name: string;
      sort_order: string;
      image_urls: string[];
      skus: SkuJson[] | null;
    }[]
  >`
     SELECT
       pc.id::text AS id,
       pc.color_name,
       pc.sort_order::text,
       pc.image_urls,
       COALESCE(
         json_agg(
           json_build_object(
             'barcode', s.barcode,
             'size_label', s.size_label,
             'price', s.price::text,
             'old_price', s.old_price::text,
             'available', s.available
           )
           ORDER BY s.size_label NULLS LAST, s.barcode
         ) FILTER (WHERE s.barcode IS NOT NULL),
         '[]'::json
       ) AS skus
     FROM product_colors pc
     LEFT JOIN skus s ON s.product_color_id = pc.id
     WHERE pc.product_id = ${productId}::uuid
     GROUP BY pc.id, pc.color_name, pc.sort_order, pc.image_urls
     ORDER BY pc.sort_order`;

  return rows.map((r) => ({
    id: r.id,
    color_name: r.color_name,
    sort_order: parseInt(r.sort_order, 10) || 0,
    image_urls: r.image_urls?.length ? r.image_urls : null,
    skus: Array.isArray(r.skus) ? r.skus : [],
  }));
}
