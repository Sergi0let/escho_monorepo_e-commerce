#!/usr/bin/env node
/**
 * CLI: імпорт YML/XML фіду в PostgreSQL.
 * Потрібен зібраний пакет: npm run build
 *
 * Приклад:
 *   DATABASE_URL=postgresql://catalog:catalog@localhost:5433/catalog \
 *     node scripts/import-feed.mjs ../../feeds/159.xml
 *
 * Або з кореня монорепо:
 *   cd packages/catalog-import && npm run import:feed -- ../../feeds/159.xml
 */
import process from 'node:process';
import pg from 'pg';
import { createCatalogImporter } from '../dist/index.js';

const url = process.env.DATABASE_URL;
const filePath = process.argv[2];

if (!url) {
  console.error(
    'Задайте DATABASE_URL (наприклад postgresql://catalog:catalog@localhost:5436/catalog)',
  );
  process.exit(1);
}
if (!filePath) {
  console.error('Вкажіть шлях до .xml: node scripts/import-feed.mjs /шлях/до/фіду.xml');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
const importer = createCatalogImporter(pool, {
  onPriceWarning: (w) => console.warn('[price]', w),
});

try {
  const result = await importer.importFromFile(filePath);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
