import type { Pool, PoolClient } from 'pg';
import type { BuiltProduct, CategoryRow, ImportResult, PriceWarning } from './types.js';

export interface PersistOptions {
  /** Розмір транзакційних чанків продуктів (після категорій). */
  productChunkSize?: number;
}

/** Батько має бути вставлений раніше за дитину (FK). */
export function sortCategoriesForInsert(m: Map<bigint, CategoryRow>): CategoryRow[] {
  const out: CategoryRow[] = [];
  const visiting = new Set<bigint>();
  const visited = new Set<bigint>();

  function visit(id: bigint) {
    if (visited.has(id)) return;
    if (visiting.has(id)) return;
    const c = m.get(id);
    if (!c) return;
    visiting.add(id);
    if (c.parentId !== null && m.has(c.parentId)) {
      visit(c.parentId);
    }
    visiting.delete(id);
    visited.add(id);
    out.push(c);
  }

  for (const id of m.keys()) visit(id);
  return out;
}

function parentIdForInsert(c: CategoryRow, m: Map<bigint, CategoryRow>): bigint | null {
  if (c.parentId === null) return null;
  return m.has(c.parentId) ? c.parentId : null;
}

export async function upsertCategories(
  pool: Pool,
  categories: Map<bigint, CategoryRow>,
): Promise<number> {
  const client = await pool.connect();
  try {
    let n = 0;
    const ordered = sortCategoriesForInsert(categories);
    for (const c of ordered) {
      const pid = parentIdForInsert(c, categories);
      await client.query(
        `INSERT INTO categories (id, parent_id, name, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (id) DO UPDATE SET
           parent_id = EXCLUDED.parent_id,
           name = EXCLUDED.name,
           updated_at = now()`,
        [c.id.toString(), pid === null ? null : pid.toString(), c.name],
      );
      n += 1;
    }
    return n;
  } finally {
    client.release();
  }
}

async function upsertOneProduct(client: PoolClient, p: BuiltProduct): Promise<{
  colors: number;
  skus: number;
}> {
  const r = await client.query<{ id: string }>(
    `INSERT INTO products (
       group_key, title, description, category_id, gender, brand, fabric, country, product_kind, feed_shop_name, updated_at
     ) VALUES ($1, $2, $3, $4, $5::gender, $6, $7, $8, $9, $10, now())
     ON CONFLICT (group_key) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       category_id = EXCLUDED.category_id,
       gender = EXCLUDED.gender,
       brand = EXCLUDED.brand,
       fabric = EXCLUDED.fabric,
       country = EXCLUDED.country,
       product_kind = EXCLUDED.product_kind,
       feed_shop_name = EXCLUDED.feed_shop_name,
       updated_at = now()
     RETURNING id`,
    [
      p.groupKey,
      p.title,
      p.description,
      p.categoryId.toString(),
      p.gender,
      p.brand,
      p.fabric,
      p.country,
      p.productKind,
      p.feedShopName,
    ],
  );
  const productId = r.rows[0].id;
  let colorN = 0;
  let skuN = 0;

  for (const col of p.colors) {
    const cr = await client.query<{ id: string }>(
      `INSERT INTO product_colors (product_id, color_name, sort_order, image_urls)
       VALUES ($1, $2, $3, $4::text[])
       ON CONFLICT (product_id, color_name) DO UPDATE SET
         sort_order = EXCLUDED.sort_order,
         image_urls = EXCLUDED.image_urls
       RETURNING id`,
      [productId, col.colorName, col.sortOrder, col.imageUrls],
    );
    const colorId = cr.rows[0].id;
    colorN += 1;

    for (const sku of col.skus) {
      await client.query(
        `INSERT INTO skus (
           barcode, product_id, product_color_id, external_offer_id, size_label,
           price, old_price, currency, stock_quantity, available,
           chest_cm, waist_cm, hips_cm
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (barcode) DO UPDATE SET
           product_id = EXCLUDED.product_id,
           product_color_id = EXCLUDED.product_color_id,
           external_offer_id = EXCLUDED.external_offer_id,
           size_label = EXCLUDED.size_label,
           price = EXCLUDED.price,
           old_price = EXCLUDED.old_price,
           currency = EXCLUDED.currency,
           stock_quantity = EXCLUDED.stock_quantity,
           available = EXCLUDED.available,
           chest_cm = EXCLUDED.chest_cm,
           waist_cm = EXCLUDED.waist_cm,
           hips_cm = EXCLUDED.hips_cm`,
        [
          sku.barcode,
          productId,
          colorId,
          sku.externalOfferId,
          sku.sizeLabel,
          sku.price,
          sku.oldPrice,
          sku.currency,
          sku.stockQuantity,
          sku.available,
          sku.chestCm,
          sku.waistCm,
          sku.hipsCm,
        ],
      );
      skuN += 1;
    }
  }
  return { colors: colorN, skus: skuN };
}

/**
 * Зберігає категорії та побудовані продукти в PostgreSQL.
 */
export async function persistImport(
  pool: Pool,
  input: { categories: Map<bigint, CategoryRow>; products: BuiltProduct[] },
  _options: PersistOptions = {},
): Promise<ImportResult> {
  const cats = await upsertCategories(pool, input.categories);
  let productsUpserted = 0;
  let colorsUpserted = 0;
  let skusUpserted = 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const p of input.products) {
      const { colors, skus } = await upsertOneProduct(client, p);
      productsUpserted += 1;
      colorsUpserted += colors;
      skusUpserted += skus;
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return {
    categoriesUpserted: cats,
    productsUpserted,
    colorsUpserted,
    skusUpserted,
    warnings: [],
  };
}

/** Обʼєднує результат persist зі зібраними попередженнями нормалізації. */
export function withWarnings(result: ImportResult, warnings: PriceWarning[]): ImportResult {
  return { ...result, warnings };
}
