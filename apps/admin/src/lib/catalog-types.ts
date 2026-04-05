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
