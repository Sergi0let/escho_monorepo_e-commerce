import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildProductGraph } from './graph.js';
import { getCategoryNameChain, inferGender } from './gender.js';
import { normalizeOffer, normalizePrices, upgradeImageUrlsToHttps } from './normalize.js';
import { parseYmlCatalogFull } from './parser.js';
import { sortCategoriesForInsert } from './persist.js';
import type { CategoryRow } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mini159 = join(__dirname, 'fixtures', 'mini-159.xml');
const mini194 = join(__dirname, 'fixtures', 'mini-194.xml');

describe('upgradeImageUrlsToHttps', () => {
  it('перекладає http CRM на https', () => {
    const u = upgradeImageUrlsToHttps(['http://crm.newtrend.team/a.jpg']);
    expect(u[0]).toBe('https://crm.newtrend.team/a.jpg');
  });
});

describe('normalizePrices', () => {
  it('піднімає old якщо ціна більша за стару', () => {
    const w: unknown[] = [];
    const r = normalizePrices('100', '50', undefined, '1', (x) => w.push(x));
    expect(r.price).toBe(100);
    expect(r.oldPrice).toBe(100);
    expect(w).toHaveLength(1);
  });
});

describe('parseYmlCatalogFull + graph (mini-159)', () => {
  it('групує два кольори в одну групу group_id', async () => {
    const { categories, shopName, offers } = await parseYmlCatalogFull(mini159);
    expect(shopName).toBe('ProDobro');
    expect(offers).toHaveLength(2);
    const norm = offers.map((o) => normalizeOffer(o, shopName));
    const products = buildProductGraph(norm, categories);
    expect(products).toHaveLength(1);
    expect(products[0].groupKey).toBe('407656111');
    expect(products[0].colors).toHaveLength(2);
    expect(products[0].gender).toBe('female');
    const https = products[0].colors.find((c) => c.colorName === 'Білий')?.imageUrls[0];
    expect(https?.startsWith('https://')).toBe(true);
  });
});

describe('parse mini-194 oldprice + ОГ', () => {
  it('читає oldprice та виміри; нормалізує ціну', async () => {
    const { categories, offers } = await parseYmlCatalogFull(mini194);
    expect(offers).toHaveLength(2);
    const warnings: unknown[] = [];
    const n0 = normalizeOffer(offers[0]!, 'New Trend', (w) => warnings.push(w));
    expect(n0.oldPrice).toBe(3000);
    expect(n0.price).toBe(2299);
    expect(n0.chestCm).toBe('142');

    const n1 = normalizeOffer(offers[1]!, 'New Trend', (w) => warnings.push(w));
    expect(n1.price).toBe(2299);
    expect(n1.oldPrice).toBe(2299);
    expect(warnings.length).toBeGreaterThanOrEqual(1);

    const products = buildProductGraph(
      offers.map((o) => normalizeOffer(o, 'New Trend')),
      categories,
    );
    expect(products).toHaveLength(1);
    expect(products[0].fabric).toBe('Плащівка');
    expect(products[0].gender).toBe('female');
    const sku = products[0].colors[0]?.skus.find((s) => s.sizeLabel === '58/60');
    expect(sku?.chestCm).toBe(142);
    expect(sku?.waistCm).toBe(136);
    expect(sku?.hipsCm).toBe(146);
  });
});

describe('categories order + gender chain', () => {
  it('sortCategoriesForInsert ставить батька перед дитиною', () => {
    const m = new Map<bigint, CategoryRow>();
    m.set(2n, { id: 2n, parentId: 1n, name: 'Child' });
    m.set(1n, { id: 1n, parentId: null, name: 'Root' });
    const s = sortCategoriesForInsert(m);
    const idxRoot = s.findIndex((r) => r.id === 1n);
    const idxChild = s.findIndex((r) => r.id === 2n);
    expect(idxRoot).toBeLessThan(idxChild);
  });

  it('getCategoryNameChain збирає назви до кореня', () => {
    const m = new Map<bigint, CategoryRow>();
    m.set(3610n, { id: 3610n, parentId: null, name: 'Одяг' });
    m.set(5908n, { id: 5908n, parentId: 3610n, name: 'Жіночий одяг великих розмірів' });
    m.set(6079n, { id: 6079n, parentId: 5908n, name: 'Зимові куртки' });
    const chain = getCategoryNameChain(6079n, m);
    expect(chain[0]).toContain('Зимові');
    expect(chain.join(' ')).toMatch(/Жіноч/);
  });

  it('inferGender: чоловічий одяг', () => {
    const m = new Map<bigint, CategoryRow>();
    m.set(1n, { id: 1n, parentId: null, name: 'Одяг' });
    m.set(2n, { id: 2n, parentId: 1n, name: 'Чоловічі сорочки' });
    expect(inferGender(2n, m, '')).toBe('male');
  });

  it('inferGender: назва розділу «Чоловікам» без «чоловіч»', () => {
    const m = new Map<bigint, CategoryRow>();
    m.set(1n, { id: 1n, parentId: null, name: 'Каталог' });
    m.set(2n, { id: 2n, parentId: 1n, name: 'Чоловікам' });
    expect(inferGender(2n, m, '')).toBe('male');
  });
});
