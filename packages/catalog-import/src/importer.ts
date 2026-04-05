import type { Readable } from 'node:stream';
import type { Pool } from 'pg';
import { buildProductGraph, mergeBuiltProducts } from './graph.js';
import { normalizeOffer } from './normalize.js';
import { parseYmlCatalogBatches } from './parser.js';
import { persistImport, withWarnings } from './persist.js';
import type {
  BuiltProduct,
  CatalogImporterOptions,
  CategoryRow,
  ImportResult,
  PriceWarning,
} from './types.js';

export interface CatalogImporter {
  importFromFile(path: string): Promise<ImportResult>;
  importFromReadable(stream: Readable): Promise<ImportResult>;
}

/**
 * Фабрика імпортера для Express / Nest / Next: пул PostgreSQL + опції батчу.
 */
export function createCatalogImporter(
  pool: Pool,
  options: CatalogImporterOptions = {},
): CatalogImporter {
  const batchSize = options.offerBatchSize ?? 500;

  async function run(source: string | Readable): Promise<ImportResult> {
    const warnings: PriceWarning[] = [];
    const onPriceWarning = options.onPriceWarning ?? ((w: PriceWarning) => warnings.push(w));

    const productMap = new Map<string, BuiltProduct>();
    const categories = new Map<bigint, CategoryRow>();

    await parseYmlCatalogBatches(source, {
      batchSize,
      categories,
      async onBatch(batch) {
        const feedName = batch.shopName.trim() || 'Feed';
        const normalized = batch.offers.map((o) =>
          normalizeOffer(o, feedName, onPriceWarning),
        );
        const chunk = buildProductGraph(normalized, categories);
        for (const p of chunk) {
          const ex = productMap.get(p.groupKey);
          productMap.set(p.groupKey, ex ? mergeBuiltProducts(ex, p) : p);
        }
      },
    });

    const result = await persistImport(pool, {
      categories,
      products: [...productMap.values()],
    });
    return withWarnings(result, warnings);
  }

  return {
    importFromFile(path: string) {
      return run(path);
    },
    importFromReadable(stream: Readable) {
      return run(stream);
    },
  };
}
