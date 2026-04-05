/**
 * Каталог: дані з catalog-api (Prisma у @repo/db).
 * Типи дубльовані тут для імпортів `@/lib/queries` у компонентах.
 */
export type {
	CatalogFilterOptions,
	CatalogGridItem,
	CatalogListFilters,
	CategoryRow,
	ColorWithSkus,
	ProductColorCardItem,
	ProductDetail,
	ProductListItem,
	SkuJson,
} from './catalog-types';

export {
	countProductsByCategory,
	countStockedProducts,
	getCatalogFilterOptions,
	getCategoryById,
	getFeaturedProducts,
	getFeaturedProductsBalanced,
	getProductById,
	getProductColorsWithSkus,
	getProductsByCategory,
	getStockedProductsPage,
	getStorefrontNavCategories,
} from './catalog-client';
