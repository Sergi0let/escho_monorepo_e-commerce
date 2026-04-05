import type {
	CatalogFilterOptions,
	CatalogGridItem,
	CatalogListFilters,
	CategoryRow,
	ColorWithSkus,
	ProductDetail,
	ProductListItem,
} from './catalog-types';

function appendListFilters(
	sp: URLSearchParams,
	filters: CatalogListFilters | undefined,
): void {
	if (filters?.color?.trim()) sp.set('color', filters.color.trim());
	if (filters?.size?.trim()) sp.set('size', filters.size.trim());
	if (filters?.priceMin !== undefined && Number.isFinite(filters.priceMin)) {
		sp.set('price_min', String(Math.round(filters.priceMin)));
	}
	if (filters?.priceMax !== undefined && Number.isFinite(filters.priceMax)) {
		sp.set('price_max', String(Math.round(filters.priceMax)));
	}
}

function getCatalogApiBaseUrl(): string {
	/** Порожній рядок з next.config `env` ламає `??` — тоді fetch отримує відносний URL і падає в Node. */
	const raw =
		[
			process.env.NEXT_PUBLIC_CATALOG_API_URL,
			process.env.CATALOG_API_URL,
			process.env.INTERNAL_CATALOG_API_URL,
		]
			.map((s) => s?.trim())
			.find((s) => s && s.length > 0) ?? 'http://127.0.0.1:4001';
	return raw.replace(/\/$/, '');
}

async function catalogFetch<T>(path: string): Promise<T> {
	const base = getCatalogApiBaseUrl();
	const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
	const res = await fetch(url, { cache: 'no-store' });
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Catalog API ${res.status}: ${text.slice(0, 240)}`);
	}
	return res.json() as Promise<T>;
}

async function catalogFetchNullable<T>(path: string): Promise<T | null> {
	const base = getCatalogApiBaseUrl();
	const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
	const res = await fetch(url, { cache: 'no-store' });
	if (res.status === 404) return null;
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Catalog API ${res.status}: ${text.slice(0, 240)}`);
	}
	return res.json() as Promise<T>;
}

export async function getStorefrontNavCategories(
	limit = 80,
): Promise<CategoryRow[]> {
	return catalogFetch<CategoryRow[]>(`/api/categories/nav?limit=${limit}`);
}

export async function getCategoryById(id: bigint): Promise<CategoryRow | null> {
	return catalogFetchNullable<CategoryRow>(`/api/categories/${id.toString()}`);
}

export async function countStockedProducts(
	filters?: CatalogListFilters,
): Promise<number> {
	const sp = new URLSearchParams();
	appendListFilters(sp, filters);
	const q = sp.toString();
	const r = await catalogFetch<{ count: number }>(
		`/api/products/count${q ? `?${q}` : ''}`,
	);
	return r.count;
}

export async function getStockedProductsPage(
	limit: number,
	offset: number,
	filters?: CatalogListFilters,
): Promise<CatalogGridItem[]> {
	const sp = new URLSearchParams({
		limit: String(limit),
		offset: String(offset),
	});
	appendListFilters(sp, filters);
	return catalogFetch<CatalogGridItem[]>(`/api/products?${sp.toString()}`);
}

export async function countProductsByCategory(
	categoryId: bigint,
	filters?: CatalogListFilters,
): Promise<number> {
	const sp = new URLSearchParams();
	appendListFilters(sp, filters);
	const q = sp.toString();
	const r = await catalogFetch<{ count: number }>(
		`/api/categories/${categoryId.toString()}/products/count${q ? `?${q}` : ''}`,
	);
	return r.count;
}

export async function getProductsByCategory(
	categoryId: bigint,
	limit = 48,
	offset = 0,
	filters?: CatalogListFilters,
): Promise<CatalogGridItem[]> {
	const sp = new URLSearchParams({
		limit: String(limit),
		offset: String(offset),
	});
	appendListFilters(sp, filters);
	return catalogFetch<CatalogGridItem[]>(
		`/api/categories/${categoryId.toString()}/products?${sp.toString()}`,
	);
}

export async function getCatalogFilterOptions(
	categoryId?: bigint,
): Promise<CatalogFilterOptions> {
	const q =
		categoryId != null
			? `?categoryId=${encodeURIComponent(categoryId.toString())}`
			: '';
	return catalogFetch<CatalogFilterOptions>(`/api/catalog/filter-options${q}`);
}

export async function getFeaturedProducts(
	limit = 12,
): Promise<ProductListItem[]> {
	return catalogFetch<ProductListItem[]>(
		`/api/products/featured/balanced?limit=${limit}`,
	);
}

export async function getFeaturedProductsBalanced(
	limit = 12,
): Promise<ProductListItem[]> {
	return catalogFetch<ProductListItem[]>(
		`/api/products/featured/balanced?limit=${limit}`,
	);
}

export async function getProductById(
	productId: string,
): Promise<ProductDetail | null> {
	return catalogFetchNullable<ProductDetail>(
		`/api/products/detail/${productId}`,
	);
}

export async function getProductColorsWithSkus(
	productId: string,
): Promise<ColorWithSkus[]> {
	return catalogFetch<ColorWithSkus[]>(`/api/products/${productId}/colors`);
}
