/** Відповіді GET catalog-api (узгоджено з packages/db dto). */

export type ProductListItem = {
	id: string;
	title: string | null;
	price_from: string | null;
	thumb: string | null;
	gender: string;
	product_kind: string | null;
};

export type ProductColorCardItem = {
	id: string;
	product_id: string;
	title: string | null;
	color_name: string;
	price_from: string | null;
	thumb: string | null;
	gender: string;
	product_kind: string | null;
};

export type CatalogGridItem = ProductListItem | ProductColorCardItem;

export type CategoryRow = {
	id: string;
	name: string;
	parent_id: string | null;
};

export type ProductDetail = {
	id: string;
	title: string | null;
	description: string | null;
	gender: string;
	brand: string | null;
	fabric: string | null;
	country: string | null;
	product_kind: string | null;
	feed_shop_name: string | null;
	category_id: string | null;
	category_name: string | null;
};

export type SkuJson = {
	barcode: string;
	size_label: string | null;
	price: string;
	old_price: string;
	available: boolean;
};

export type ColorWithSkus = {
	id: string;
	color_name: string;
	sort_order: number;
	image_urls: string[] | null;
	skus: SkuJson[];
};
