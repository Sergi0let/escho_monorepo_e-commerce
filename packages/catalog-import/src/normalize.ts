import type { NormalizedOffer, PriceWarning, RawOffer } from './types.js';

const CRM_HOST = 'crm.newtrend.team';

/** HTTP → HTTPS для медіа CRM. */
export function upgradeImageUrlsToHttps(urls: string[]): string[] {
  return urls.map((s) => {
    try {
      const u = new URL(s);
      if (u.hostname === CRM_HOST && u.protocol === 'http:') {
        u.protocol = 'https:';
        return u.toString();
      }
      return s;
    } catch {
      return s;
    }
  });
}

function parseNum(s: string | undefined): number | null {
  if (s === undefined || s === '') return null;
  const n = Number(String(s).replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}

function pickParam(params: Array<{ name: string; value: string }>, ...keys: string[]): string | null {
  const lower = keys.map((k) => k.toLowerCase());
  for (const p of params) {
    const n = p.name.trim().toLowerCase();
    if (lower.includes(n)) {
      const v = p.value.trim();
      if (v) return v;
    }
  }
  return null;
}

/**
 * Нормалізує ціни: обовʼязкові price та oldPrice; oldPrice >= price.
 * Якщо old відсутня — old = price.
 */
export function normalizePrices(
  priceStr: string,
  oldFromUnderscore: string | undefined,
  oldFromLower: string | undefined,
  offerId: string,
  onWarning?: (w: PriceWarning) => void,
): { price: number; oldPrice: number } {
  const price = parseNum(priceStr);
  if (price === null) {
    throw new Error(`offer ${offerId}: invalid price "${priceStr}"`);
  }
  const oldRaw = oldFromUnderscore ?? oldFromLower;
  let oldPrice = parseNum(oldRaw);
  if (oldPrice === null) {
    oldPrice = price;
  }
  if (oldPrice < price) {
    onWarning?.({ kind: 'price_gt_old', offerId, price, oldPrice });
    oldPrice = Math.max(oldPrice, price);
  }
  return { price, oldPrice };
}

/** Перетворює RawOffer на NormalizedOffer. */
export function normalizeOffer(
  raw: RawOffer,
  feedShopName: string,
  onWarning?: (w: PriceWarning) => void,
): NormalizedOffer {
  const { oldPriceRaw: _ou, oldpriceRaw: _ol, price: _rp, ...restBase } = raw;
  const { price, oldPrice } = normalizePrices(
    raw.price,
    raw.oldPriceRaw,
    raw.oldpriceRaw,
    raw.id,
    onWarning,
  );

  const params = restBase.params;
  const colorName =
    pickParam(params, 'колір', 'цвет', 'color') ?? '—';
  const sizeLabel = pickParam(params, 'розмір', 'размер', 'size');
  const brand = pickParam(params, 'бренд', 'brand') ?? raw.vendor?.trim() ?? null;
  const fabric = pickParam(params, 'тканина', 'ткань', 'fabric');
  const country = pickParam(params, 'країна-виробник', 'країна виробник', 'страна-производитель');
  const productKind = pickParam(params, 'вид виробу', 'вид выработки', 'тип');

  let chest = parseNum(raw.chestCm);
  let waist = parseNum(raw.waistCm);
  let hips = parseNum(raw.hipsCm);
  const og = pickParam(params, 'ог', 'oг');
  const ot = pickParam(params, 'от', 'oт');
  const os = pickParam(params, 'ос', 'oс');
  if (chest === null && og !== null) chest = parseNum(og);
  if (waist === null && ot !== null) waist = parseNum(ot);
  if (hips === null && os !== null) hips = parseNum(os);

  return {
    ...restBase,
    params,
    price,
    oldPrice,
    pictures: upgradeImageUrlsToHttps([...raw.pictures]),
    colorName,
    sizeLabel,
    brand,
    fabric,
    country,
    productKind,
    feedShopName,
    chestCm: chest !== null ? String(chest) : undefined,
    waistCm: waist !== null ? String(waist) : undefined,
    hipsCm: hips !== null ? String(hips) : undefined,
  };
}
