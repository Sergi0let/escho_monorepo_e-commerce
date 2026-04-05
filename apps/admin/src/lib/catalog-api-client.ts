import type { CatalogGridItem, CategoryRow } from "./catalog-types";

function catalogBaseUrl(): string {
	const raw =
		(import.meta.env.VITE_CATALOG_API_URL as string | undefined)?.trim() ||
		"http://127.0.0.1:4001";
	return raw.replace(/\/$/, "");
}

async function apiGet<T>(path: string): Promise<T> {
	const url = `${catalogBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
	const res = await fetch(url);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Catalog API ${res.status}: ${text.slice(0, 240)}`);
	}
	return res.json() as Promise<T>;
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
	const r = await apiGet<{ count: number }>("/api/products/count");
	return typeof r.count === "number" ? r.count : 0;
}
