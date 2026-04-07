import type {
	CatalogGridItem,
	CategoryRow,
	ColorWithSkus,
	ProductDetail,
} from './catalog-types';

function catalogBaseUrl(): string {
	const raw =
		(import.meta.env.VITE_CATALOG_API_URL as string | undefined)?.trim() ||
		'http://127.0.0.1:4002';
	return raw.replace(/\/$/, '');
}

/**
 * Той самий секрет, що `ADMIN_API_KEY` у catalog-api.
 * Vite вбудовує значення в клієнтський бандл — для продакшену краще BFF/проксі.
 */
function catalogAdminApiKey(): string | undefined {
	const k = (import.meta.env.VITE_CATALOG_ADMIN_API_KEY as string | undefined)?.trim();
	return k && k.length > 0 ? k : undefined;
}

/** Усі запити до catalog-api: додає X-API-Key, якщо задано VITE_CATALOG_ADMIN_API_KEY (потрібно для /api/admin/*). */
export async function catalogApiFetch<T>(
	path: string,
	init: RequestInit = {},
): Promise<T> {
	const url = `${catalogBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
	const headers = new Headers(init.headers);
	const key = catalogAdminApiKey();
	if (key) headers.set('X-API-Key', key);
	const res = await fetch(url, { ...init, headers });
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Catalog API ${res.status}: ${text.slice(0, 240)}`);
	}
	return res.json() as Promise<T>;
}

async function apiGet<T>(path: string): Promise<T> {
	return catalogApiFetch<T>(path, { method: 'GET' });
}

async function apiGetNullable<T>(path: string): Promise<T | null> {
	const url = `${catalogBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
	const headers = new Headers();
	const key = catalogAdminApiKey();
	if (key) headers.set('X-API-Key', key);
	const res = await fetch(url, { headers, cache: 'no-store' });
	if (res.status === 404) return null;
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Catalog API ${res.status}: ${text.slice(0, 240)}`);
	}
	return res.json() as Promise<T>;
}

export async function fetchProductDetail(
	productId: string,
): Promise<ProductDetail | null> {
	return apiGetNullable<ProductDetail>(`/api/products/detail/${productId}`);
}

export async function fetchProductColorsWithSkus(
	productId: string,
): Promise<ColorWithSkus[]> {
	return apiGet<ColorWithSkus[]>(`/api/products/${productId}/colors`);
}

export type AdminCreateCategoryBody = {
	id: number | string;
	name: string;
	parent_id?: number | string | null;
};

export type AdminPatchCategoryBody = {
	name?: string;
	parent_id?: number | string | null;
};

export type AdminPatchProductBody = Partial<{
	title: string | null;
	description: string | null;
	brand: string | null;
	fabric: string | null;
	country: string | null;
	product_kind: string | null;
	feed_shop_name: string | null;
	category_id: number | string | null;
	gender: string;
}>;

export async function createAdminCategory(
	body: AdminCreateCategoryBody,
): Promise<{ id: string; name: string; parent_id: string | null }> {
	return catalogApiFetch('/api/admin/categories', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

export async function updateAdminCategory(
	id: string,
	body: AdminPatchCategoryBody,
): Promise<{ id: string; name: string; parent_id: string | null }> {
	return catalogApiFetch(`/api/admin/categories/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

export async function updateAdminProduct(
	productId: string,
	body: AdminPatchProductBody,
): Promise<ProductDetail> {
	return catalogApiFetch(`/api/admin/products/${productId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

export async function fetchNavCategories(limit = 200): Promise<CategoryRow[]> {
	const n = Math.min(200, Math.max(1, limit));
	return apiGet<CategoryRow[]>(`/api/categories/nav?limit=${n}`);
}

export async function fetchProductsPage(
	limit: number,
	offset: number,
): Promise<CatalogGridItem[]> {
	const sp = new URLSearchParams({
		limit: String(Math.min(200, Math.max(1, limit))),
		offset: String(Math.max(0, offset)),
	});
	return apiGet<CatalogGridItem[]>(`/api/products?${sp.toString()}`);
}

export async function fetchProductsCount(): Promise<number> {
	const r = await apiGet<{ count: number }>('/api/products/count');
	return typeof r.count === 'number' ? r.count : 0;
}
