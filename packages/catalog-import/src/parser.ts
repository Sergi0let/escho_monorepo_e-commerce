import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { SaxesParser } from 'saxes';
import type { CategoryRow, ParseBatch, RawOffer } from './types.js';

type TagAttrs = Record<string, string>;

interface OfferInnerFrame {
  tag: string;
  text: string;
  attrs: TagAttrs;
}

function attrMap(attrs: Record<string, string> | undefined): TagAttrs {
  if (!attrs) return {};
  const out: TagAttrs = {};
  for (const [k, v] of Object.entries(attrs)) {
    out[k] = v;
  }
  return out;
}

function emptyOffer(attrs: TagAttrs): RawOffer {
  return {
    id: attrs.id ?? '',
    groupId: attrs.group_id ?? attrs.groupId ?? null,
    available: (attrs.available ?? 'true').toLowerCase() === 'true',
    price: '',
    currencyId: '',
    categoryId: '',
    pictures: [],
    params: [],
  };
}

/**
 * Стріминговий парсинг YML: спочатку категорії, потім батчі оферів.
 */
export async function parseYmlCatalogBatches(
  source: string | Readable,
  options: {
    batchSize?: number;
    onBatch?: (batch: ParseBatch) => void | Promise<void>;
    /** Якщо передано, категорії пишуться в цю мапу (для колбеків до завершення `await`). */
    categories?: Map<bigint, CategoryRow>;
  } = {},
): Promise<{ categories: Map<bigint, CategoryRow>; shopName: string; offerCount: number }> {
  const batchSize = Math.max(1, options.batchSize ?? 500);
  const categories = options.categories ?? new Map<bigint, CategoryRow>();
  let shopName = '';
  let offerCount = 0;

  const parser = new SaxesParser({ xmlns: false, position: false });
  const tagStack: string[] = [];

  let insideCategories = false;
  let insideOffers = false;
  let shopNameCapture: { text: string } | null = null;

  let categoryOpen: { id: string; parentId: string | null; text: string } | null = null;

  let currentOffer: RawOffer | null = null;
  let offerInner: OfferInnerFrame[] = [];

  let offerBatch: RawOffer[] = [];
  const pendingFlushes: Promise<void>[] = [];

  function flushCategory() {
    if (!categoryOpen) return;
    const id = BigInt(categoryOpen.id);
    const parentRaw = categoryOpen.parentId;
    const parentId =
      parentRaw === null || parentRaw === undefined || parentRaw === ''
        ? null
        : BigInt(parentRaw);
    categories.set(id, {
      id,
      parentId,
      name: categoryOpen.text.trim(),
    });
    categoryOpen = null;
  }

  function mergeCloseOfferField(tag: string, text: string, attrs: TagAttrs) {
    if (!currentOffer) return;
    const t = text.trim();
    switch (tag) {
      case 'price':
        currentOffer.price = t;
        break;
      case 'old_price':
        currentOffer.oldPriceRaw = t;
        break;
      case 'oldprice':
        currentOffer.oldpriceRaw = t;
        break;
      case 'currencyId':
        currentOffer.currencyId = t;
        break;
      case 'categoryId':
        currentOffer.categoryId = t;
        break;
      case 'vendorCode':
        currentOffer.vendorCode = t;
        break;
      case 'picture':
        if (t) currentOffer.pictures.push(t);
        break;
      case 'barcode':
        currentOffer.barcode = t;
        break;
      case 'name':
        currentOffer.name = t;
        break;
      case 'vendor':
        currentOffer.vendor = t;
        break;
      case 'stock_quantity':
        currentOffer.stockQuantity = t;
        break;
      case 'description':
        currentOffer.description = t;
        break;
      case 'description_ua':
        currentOffer.descriptionUa = t;
        break;
      case 'name_ua':
        currentOffer.nameUa = t;
        break;
      case 'article':
        currentOffer.article = t;
        break;
      case 'param': {
        const pn = attrs.name ?? attrs.Name ?? '';
        if (pn && t) currentOffer.params.push({ name: pn, value: t });
        break;
      }
      case 'ОГ':
        currentOffer.chestCm = t;
        break;
      case 'ОТ':
        currentOffer.waistCm = t;
        break;
      case 'ОС':
        currentOffer.hipsCm = t;
        break;
      default:
        break;
    }
  }

  async function flushOfferBatch() {
    if (offerBatch.length === 0) return;
    const batch = { offers: [...offerBatch], shopName };
    offerBatch = [];
    await options.onBatch?.(batch);
  }

  parser.on('opentag', (tag) => {
    const name = tag.name;
    const attrs = attrMap(tag.attributes as Record<string, string> | undefined);
    const parent = tagStack[tagStack.length - 1];

    tagStack.push(name);

    if (name === 'name' && parent === 'shop' && !insideCategories && !insideOffers) {
      shopNameCapture = { text: '' };
    }

    if (name === 'categories') {
      insideCategories = true;
    } else if (name === 'offers') {
      insideOffers = true;
    } else if (insideCategories && name === 'category' && !currentOffer) {
      categoryOpen = {
        id: attrs.id ?? '',
        parentId: attrs.parentId ?? attrs.parentid ?? null,
        text: '',
      };
    } else if (insideOffers && name === 'offer') {
      currentOffer = emptyOffer(attrs);
      offerInner = [];
    } else if (currentOffer && name !== 'offer') {
      offerInner.push({ tag: name, text: '', attrs });
    }
  });

  parser.on('text', (text) => {
    if (shopNameCapture && tagStack[tagStack.length - 1] === 'name') {
      shopNameCapture.text += text;
    }
    if (categoryOpen && tagStack[tagStack.length - 1] === 'category') {
      categoryOpen.text += text;
    }
    if (offerInner.length > 0) {
      offerInner[offerInner.length - 1].text += text;
    }
  });

  parser.on('cdata', (data) => {
    if (shopNameCapture && tagStack[tagStack.length - 1] === 'name') {
      shopNameCapture.text += data;
    }
    if (categoryOpen && tagStack[tagStack.length - 1] === 'category') {
      categoryOpen.text += data;
    }
    if (offerInner.length > 0) {
      offerInner[offerInner.length - 1].text += data;
    }
  });

  parser.on('closetag', (tag) => {
    const name = tag.name;

    if (name === 'categories') {
      insideCategories = false;
      if (categoryOpen) flushCategory();
    }
    if (name === 'offers') {
      insideOffers = false;
    }

    if (name === 'name' && shopNameCapture) {
      shopName = shopNameCapture.text.trim();
      shopNameCapture = null;
    }

    if (name === 'category' && categoryOpen) {
      flushCategory();
    }

    if (currentOffer && name !== 'offer') {
      if (offerInner.length > 0) {
        const frame = offerInner.pop()!;
        if (frame.tag === name) {
          mergeCloseOfferField(name, frame.text, frame.attrs);
        }
      }
    }

    if (name === 'offer' && currentOffer) {
      offerCount += 1;
      offerBatch.push(currentOffer);
      currentOffer = null;
      offerInner = [];
      if (offerBatch.length >= batchSize) {
        const toFlush = [...offerBatch];
        offerBatch = [];
        pendingFlushes.push(
          Promise.resolve(
            options.onBatch?.({ offers: toFlush, shopName }) ?? undefined,
          ).then(() => undefined),
        );
      }
    }

    tagStack.pop();
  });

  const readStream = typeof source === 'string' ? createReadStream(source, { encoding: 'utf8' }) : source;

  readStream.setEncoding('utf8');
  for await (const chunk of readStream) {
    parser.write(chunk);
  }
  parser.close();

  await Promise.all(pendingFlushes);
  await flushOfferBatch();

  return { categories, shopName, offerCount };
}

/** Парсить файл і збирає всі офери в пам’ять (для тестів і невеликих фідів). */
export async function parseYmlCatalogFull(source: string | Readable): Promise<{
  categories: Map<bigint, CategoryRow>;
  shopName: string;
  offers: RawOffer[];
}> {
  const offers: RawOffer[] = [];
  const { categories, shopName, offerCount } = await parseYmlCatalogBatches(source, {
    batchSize: 5000,
    async onBatch(batch) {
      offers.push(...batch.offers);
    },
  });
  if (offers.length !== offerCount) {
    throw new Error(`internal: offer count mismatch ${offers.length} vs ${offerCount}`);
  }
  return { categories, shopName, offers };
}
