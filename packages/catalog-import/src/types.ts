export type Gender = 'male' | 'female' | 'unisex' | 'unknown';

/** Рядок категорії з фіду */
export interface CategoryRow {
  id: bigint;
  parentId: bigint | null;
  name: string;
}

/** Сируча пропозиція з SAX (до нормалізації) */
export interface RawOffer {
  id: string;
  groupId: string | null;
  available: boolean;
  price: string;
  oldPriceRaw?: string;
  oldpriceRaw?: string;
  currencyId: string;
  categoryId: string;
  vendorCode?: string;
  pictures: string[];
  barcode?: string;
  name?: string;
  nameUa?: string;
  vendor?: string;
  stockQuantity?: string;
  description?: string;
  descriptionUa?: string;
  article?: string;
  params: Array<{ name: string; value: string }>;
  chestCm?: string;
  waistCm?: string;
  hipsCm?: string;
}

export interface NormalizedOffer extends Omit<RawOffer, 'price' | 'oldPriceRaw' | 'oldpriceRaw'> {
  price: number;
  oldPrice: number;
  pictures: string[];
  colorName: string;
  sizeLabel: string | null;
  brand: string | null;
  fabric: string | null;
  country: string | null;
  productKind: string | null;
  feedShopName: string;
}

export interface ProductSku {
  barcode: string;
  externalOfferId: string;
  sizeLabel: string | null;
  price: number;
  oldPrice: number;
  currency: string;
  stockQuantity: number | null;
  available: boolean;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
}

export interface ProductColorNode {
  colorName: string;
  sortOrder: number;
  imageUrls: string[];
  skus: ProductSku[];
}

export interface BuiltProduct {
  groupKey: string;
  categoryId: bigint;
  title: string | null;
  description: string | null;
  gender: Gender;
  brand: string | null;
  fabric: string | null;
  country: string | null;
  productKind: string | null;
  feedShopName: string;
  colors: ProductColorNode[];
}

export type PriceWarning = { kind: 'price_gt_old'; offerId: string; price: number; oldPrice: number };

export interface ImportResult {
  categoriesUpserted: number;
  productsUpserted: number;
  colorsUpserted: number;
  skusUpserted: number;
  warnings: PriceWarning[];
}

export interface ParseBatch {
  offers: RawOffer[];
  /** Актуальне ім’я магазину станом на кінець батчу (з `<shop><name>`). */
  shopName: string;
}

export interface CatalogImporterOptions {
  /** Розмір батчу оферів для колбеку стріму */
  offerBatchSize?: number;
  /** Лог попереджень нормалізації цін */
  onPriceWarning?: (w: PriceWarning) => void;
}
