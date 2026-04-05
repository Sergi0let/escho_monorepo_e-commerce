/** Кількість карток товару на одній сторінці каталогу (головна + категорії). */
export const CATALOG_PAGE_SIZE = 24;

export function parseCatalogPage(raw: string | string[] | undefined): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(s ?? '1', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function pickSearchParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
}

export type CatalogListingFilters = {
  color?: string;
  size?: string;
  priceMin?: number;
  priceMax?: number;
};

export function parseCatalogListingSearchParams(
  sp: Record<string, string | string[] | undefined>,
): { page: number; filters: CatalogListingFilters } {
  return {
    page: parseCatalogPage(pickSearchParam(sp, 'page')),
    filters: {
      color: pickSearchParam(sp, 'color'),
      size: pickSearchParam(sp, 'size'),
    },
  };
}

export type CatalogListingQuery = CatalogListingFilters & {
  page?: number;
};

/** URL каталогу з page, color, size (GET-параметри). */
export function catalogListingHref(pathname: string, query: CatalogListingQuery): string {
  const normalized = pathname === '' ? '/' : pathname;
  const sp = new URLSearchParams();
  if (query.page && query.page > 1) sp.set('page', String(query.page));
  const c = query.color?.trim();
  const s = query.size?.trim();
  if (c) sp.set('color', c);
  if (s) sp.set('size', s);
  if (query.priceMin !== undefined && Number.isFinite(query.priceMin)) {
    sp.set('price_min', String(Math.round(query.priceMin)));
  }
  if (query.priceMax !== undefined && Number.isFinite(query.priceMax)) {
    sp.set('price_max', String(Math.round(query.priceMax)));
  }
  const qs = sp.toString();
  return qs ? `${normalized}?${qs}` : normalized;
}

/** Лише перехід на сторінку пагінації (без фільтрів). */
export function catalogPageHref(pathname: string, page: number): string {
  return catalogListingHref(pathname, { page });
}
