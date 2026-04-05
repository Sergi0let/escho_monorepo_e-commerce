'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColorWithSkus, ProductDetail } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { formatUah, genderLabel } from '@/lib/format';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProductGallerySwiper } from '@/components/ProductGallerySwiper';
import { ProductStoreSections } from '@/components/ProductStoreSections';

type Props = {
  product: ProductDetail;
  colors: ColorWithSkus[];
};

/** Короткий код для картки (як у класичних k — останні символи UUID). */
function shortProductCode(id: string): string {
  const compact = id.replace(/-/g, '');
  return compact.slice(-8).toUpperCase();
}

export function ProductDetailView({ product, colors }: Props) {
  const router = useRouter();
  const [colorId, setColorId] = useState(colors[0]?.id ?? '');
  const [activeGalleryUrl, setActiveGalleryUrl] = useState<string | null>(null);
  const onGalleryUrlChange = useCallback((url: string | null) => setActiveGalleryUrl(url), []);
  const addLine = useCartStore((s) => s.addLine);

  const color = useMemo(
    () => colors.find((c) => c.id === colorId) ?? colors[0],
    [colors, colorId],
  );

  const skus = color?.skus?.filter((s) => s.available) ?? [];
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    const list = color?.skus?.filter((s) => s.available) ?? [];
    const b = list[0]?.barcode;
    if (b) setBarcode(b);
  }, [colorId, color]);

  const galleryUrls = useMemo(
    () => [...new Set((color?.image_urls ?? []).filter(Boolean))] as string[],
    [color],
  );

  const sku = skus.find((s) => s.barcode === barcode) ?? skus[0];
  const hero = activeGalleryUrl ?? galleryUrls[0] ?? null;

  const priceNum = parseFloat(sku.price);
  const oldNum = parseFloat(sku.old_price);
  const hasDiscount =
    Number.isFinite(priceNum) && Number.isFinite(oldNum) && oldNum > priceNum;
  const discountPct = hasDiscount ? Math.round((1 - priceNum / oldNum) * 100) : 0;

  const title = product.title?.trim() || 'Без назви';

  if (!color || !sku) {
    return <p className="text-muted-foreground">Немає доступних варіантів для замовлення.</p>;
  }

  const cartLine = {
    barcode: sku.barcode,
    productId: product.id,
    title,
    colorName: color.color_name,
    sizeLabel: sku.size_label,
    price: parseFloat(sku.price),
    oldPrice: parseFloat(sku.old_price),
    image: hero,
    qty: 1 as const,
  };

  return (
    <div className="grid gap-6 min-[480px]:gap-8 lg:grid-cols-2 lg:items-start lg:gap-10 xl:gap-12">
      <div className="relative z-0 min-w-0 lg:sticky lg:top-20 lg:self-start">
        <div className="-mx-4 w-[calc(100%+2rem)] max-w-none sm:mx-0 sm:w-full">
          <Card className="overflow-visible rounded-none border-x-0 border-border/70 bg-card p-1.5 shadow-soft min-[480px]:rounded-xl min-[480px]:border-x min-[480px]:p-2 sm:p-3 lg:overflow-hidden lg:rounded-xl lg:border-border/60">
            <ProductGallerySwiper
              urls={galleryUrls}
              alt={`${title} — ${color.color_name}`}
              colorKey={color.id}
              onActiveUrlChange={onGalleryUrlChange}
            />
          </Card>
        </div>
      </div>

      <div className="min-w-0">
        <Card className="border-border/80 bg-card/80 p-4 shadow-soft backdrop-blur-sm min-[480px]:p-6 lg:p-8">
          <div className="space-y-6 sm:space-y-8">
            <header className="space-y-3 border-b border-border/80 pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {genderLabel[product.gender] ?? product.gender}
                {product.product_kind ? (
                  <>
                    {' · '}
                    {product.product_kind}
                  </>
                ) : null}
              </p>
              <h1 className="font-display text-[1.65rem] font-normal leading-[1.18] tracking-tight text-foreground sm:text-2xl md:text-3xl lg:text-[2.125rem]">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Код: <span className="font-medium text-foreground">{shortProductCode(product.id)}</span>
              </p>
            </header>

            <dl className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              {product.brand ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Бренд
                  </dt>
                  <dd className="mt-1.5 text-sm text-foreground sm:text-base">{product.brand}</dd>
                </div>
              ) : null}
              {product.fabric ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Тканина
                  </dt>
                  <dd className="mt-1.5 text-sm text-foreground sm:text-base">{product.fabric}</dd>
                </div>
              ) : null}
              {product.country ? (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Країна
                  </dt>
                  <dd className="mt-1.5 text-sm text-foreground sm:text-base">{product.country}</dd>
                </div>
              ) : null}
            </dl>

            <div className="space-y-5 pt-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Колір
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const thumb = c.image_urls?.[0];
                    const active = c.id === color.id;
                    return (
                      <Button
                        key={c.id}
                        type="button"
                        variant={active ? 'default' : 'outline'}
                        className={cn(
                          'h-auto min-h-11 w-full cursor-pointer justify-start gap-2 rounded-md border py-2 pr-3 text-sm transition-colors duration-200 min-[420px]:w-auto sm:pr-4 sm:text-base',
                          active
                            ? 'border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8] hover:text-white'
                            : 'border-border/80 bg-card hover:bg-muted/50',
                        )}
                        onClick={() => setColorId(c.id)}
                      >
                        {thumb ? (
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
                            <Image src={thumb} alt="" fill className="object-cover" sizes="40px" />
                          </span>
                        ) : null}
                        {c.color_name}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Розмір
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skus.map((s) => {
                    const active = s.barcode === sku.barcode;
                    return (
                      <Button
                        key={s.barcode}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          'min-h-11 min-w-[2.75rem] cursor-pointer rounded-md border-2 px-3 text-sm font-semibold transition-colors duration-200 touch-manipulation sm:min-h-10 sm:text-base',
                          active
                            ? 'border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8] hover:text-white'
                            : 'border-border bg-background text-foreground hover:bg-muted/60',
                        )}
                        onClick={() => setBarcode(s.barcode)}
                      >
                        {s.size_label ?? '—'}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="size-3.5 stroke-[3]" aria-hidden />
                </span>
                В наявності
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {hasDiscount ? (
                  <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                    −{discountPct}%
                  </span>
                ) : null}
                <div className="flex flex-wrap items-baseline gap-2">
                  <span
                    className={cn(
                      'font-display text-2xl font-bold tabular-nums sm:text-3xl',
                      hasDiscount ? 'text-red-600' : 'text-foreground',
                    )}
                  >
                    {formatUah(sku.price)}
                  </span>
                  {hasDiscount ? (
                    <span className="text-base text-muted-foreground line-through sm:text-lg">
                      {formatUah(sku.old_price)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
                <Button
                  type="button"
                  size="lg"
                  className="min-h-12 w-full cursor-pointer rounded-md bg-emerald-600 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors duration-200 hover:bg-emerald-700 min-[520px]:text-[15px]"
                  onClick={() => addLine(cartLine)}
                >
                  Замовити
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="min-h-12 w-full cursor-pointer rounded-md border-2 border-[#2563eb]/55 bg-background text-sm font-semibold leading-snug text-[#1e40af] transition-colors duration-200 hover:bg-[#2563eb]/5 min-[520px]:text-[15px]"
                  onClick={() => {
                    addLine(cartLine);
                    router.push('/checkout');
                  }}
                >
                  Купити в 1 клік
                </Button>
              </div>
            </div>

            <ProductStoreSections descriptionHtml={product.description} />
          </div>
        </Card>
      </div>
    </div>
  );
}
