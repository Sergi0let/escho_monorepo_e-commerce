import { inferGender } from './gender.js';
import type { BuiltProduct, CategoryRow, NormalizedOffer, ProductColorNode, ProductSku } from './types.js';

export function mergeBuiltProducts(a: BuiltProduct, b: BuiltProduct): BuiltProduct {
  if (a.groupKey !== b.groupKey) {
    throw new Error(`merge groupKey mismatch ${a.groupKey} vs ${b.groupKey}`);
  }
  const pickLonger = (x: string | null, y: string | null): string | null => {
    if (!x) return y;
    if (!y) return x;
    return x.length >= y.length ? x : y;
  };
  const colorMap = new Map<string, ProductColorNode>();
  for (const c of a.colors) {
    colorMap.set(c.colorName, {
      colorName: c.colorName,
      sortOrder: c.sortOrder,
      imageUrls: [...c.imageUrls],
      skus: [...c.skus],
    });
  }
  for (const c of b.colors) {
    const ex = colorMap.get(c.colorName);
    if (!ex) {
      colorMap.set(c.colorName, {
        colorName: c.colorName,
        sortOrder: c.sortOrder,
        imageUrls: [...c.imageUrls],
        skus: [...c.skus],
      });
    } else {
      const urls = [...ex.imageUrls];
      for (const u of c.imageUrls) {
        if (!urls.includes(u)) urls.push(u);
      }
      ex.imageUrls = urls;
      const seen = new Set(ex.skus.map((s) => s.barcode));
      for (const s of c.skus) {
        if (!seen.has(s.barcode)) {
          ex.skus.push(s);
          seen.add(s.barcode);
        }
      }
    }
  }
  const colors = [...colorMap.values()].sort((x, y) => x.sortOrder - y.sortOrder);
  return {
    groupKey: a.groupKey,
    categoryId: a.categoryId,
    title: pickLonger(a.title, b.title),
    description: pickLonger(a.description, b.description),
    gender: a.gender !== 'unknown' ? a.gender : b.gender,
    brand: a.brand ?? b.brand,
    fabric: a.fabric ?? b.fabric,
    country: a.country ?? b.country,
    productKind: a.productKind ?? b.productKind,
    feedShopName: a.feedShopName || b.feedShopName,
    colors,
  };
}

function fallbackGroupKey(offer: NormalizedOffer): string {
  if (offer.groupId) return offer.groupId;
  const vc = offer.vendorCode?.trim();
  if (vc) {
    const parts = vc.split('_');
    if (parts.length >= 3) {
      const base = parts.slice(0, -2).join('_');
      if (base.length > 0) return `vc:${base}`;
    }
  }
  return `solo:${offer.id}`;
}

function toSku(o: NormalizedOffer): ProductSku {
  const stock = o.stockQuantity ? Number(o.stockQuantity) : null;
  return {
    barcode: o.barcode ?? '',
    externalOfferId: o.id,
    sizeLabel: o.sizeLabel,
    price: o.price,
    oldPrice: o.oldPrice,
    currency: o.currencyId || 'UAH',
    stockQuantity: stock !== null && Number.isFinite(stock) ? Math.trunc(stock) : null,
    available: o.available,
    chestCm: o.chestCm ? Number(o.chestCm) : null,
    waistCm: o.waistCm ? Number(o.waistCm) : null,
    hipsCm: o.hipsCm ? Number(o.hipsCm) : null,
  };
}

/**
 * Групує нормалізовані офери в товари → кольори → SKU.
 */
export function buildProductGraph(
  offers: NormalizedOffer[],
  categories: Map<bigint, CategoryRow>,
): BuiltProduct[] {
  const byGroup = new Map<string, NormalizedOffer[]>();
  for (const o of offers) {
    const g = fallbackGroupKey(o);
    const arr = byGroup.get(g) ?? [];
    arr.push(o);
    byGroup.set(g, arr);
  }

  const products: BuiltProduct[] = [];

  for (const [groupKey, groupOffers] of byGroup) {
    const categoryId = BigInt(groupOffers[0].categoryId);
    let title: string | null = null;
    let description: string | null = null;
    for (const o of groupOffers) {
      const t = o.nameUa?.trim() || o.name?.trim() || null;
      if (t && (!title || t.length > title.length)) title = t;
      const d = o.descriptionUa?.trim() || o.description?.trim() || null;
      if (d && (!description || d.length > description.length)) description = d;
    }

    let brand: string | null = null;
    let fabric: string | null = null;
    let country: string | null = null;
    let productKind: string | null = null;
    const feedShopName = groupOffers[0].feedShopName;
    for (const o of groupOffers) {
      if (!brand && o.brand) brand = o.brand;
      if (!fabric && o.fabric) fabric = o.fabric;
      if (!country && o.country) country = o.country;
      if (!productKind && o.productKind) productKind = o.productKind;
    }

    const fallbackText = [
      title ?? '',
      description ?? '',
      groupOffers.map((x) => x.vendorCode ?? '').join(' '),
    ].join(' ');

    const gender = inferGender(categoryId, categories, fallbackText);

    const colorMap = new Map<string, ProductColorNode>();
    let sort = 0;
    for (const o of groupOffers) {
      const cname = o.colorName || '—';
      let node = colorMap.get(cname);
      if (!node) {
        sort += 1;
        node = { colorName: cname, sortOrder: sort, imageUrls: [...o.pictures], skus: [] };
        colorMap.set(cname, node);
      } else {
        for (const u of o.pictures) {
          if (!node.imageUrls.includes(u)) node.imageUrls.push(u);
        }
      }
      const sku = toSku(o);
      if (!sku.barcode) {
        throw new Error(`offer ${o.id}: missing barcode`);
      }
      node.skus.push(sku);
    }

    products.push({
      groupKey,
      categoryId,
      title,
      description,
      gender,
      brand,
      fabric,
      country,
      productKind,
      feedShopName,
      colors: [...colorMap.values()],
    });
  }

  return products;
}
