'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { CatalogFilterOptions } from '@/lib/queries';
import type { CatalogListingFilters } from '@/lib/pagination';
import { cn } from '@/lib/utils';

type Props = {
  pathname: string;
  filters: CatalogListingFilters;
  options: CatalogFilterOptions;
};

const selectClass = cn(
  'flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
);

export function CatalogFilterBar({ pathname, filters, options }: Props) {
  const router = useRouter();
  const base = pathname === '' ? '/' : pathname;
  const bounds = options.price_range;

  const [color, setColor] = useState(filters.color ?? '');
  const [size, setSize] = useState(filters.size ?? '');
  const [range, setRange] = useState<[number, number]>(() => {
    if (!bounds) return [0, 0];
    return [
      filters.priceMin ?? bounds.min,
      filters.priceMax ?? bounds.max,
    ];
  });

  useEffect(() => {
    setColor(filters.color ?? '');
    setSize(filters.size ?? '');
    if (!bounds) return;
    setRange([
      filters.priceMin ?? bounds.min,
      filters.priceMax ?? bounds.max,
    ]);
  }, [
    filters.color,
    filters.size,
    filters.priceMin,
    filters.priceMax,
    bounds?.min,
    bounds?.max,
  ]);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const sp = new URLSearchParams();
      if (color.trim()) sp.set('color', color.trim());
      if (size.trim()) sp.set('size', size.trim());
      if (bounds && bounds.max > bounds.min) {
        const lo = Math.min(range[0], range[1]);
        const hi = Math.max(range[0], range[1]);
        const atMin = lo <= bounds.min;
        const atMax = hi >= bounds.max;
        if (!atMin) sp.set('price_min', String(Math.round(lo)));
        if (!atMax) sp.set('price_max', String(Math.round(hi)));
      }
      const qs = sp.toString();
      router.push(qs ? `${base}?${qs}` : base);
    },
    [base, bounds, color, range, router, size],
  );

  const reset = useCallback(() => {
    router.push(base);
  }, [base, router]);

  const span = bounds ? bounds.max - bounds.min : 0;
  const sliderValue: [number, number] =
    bounds && span > 0
      ? [
          Math.max(0, Math.min(span, range[0] - bounds.min)),
          Math.max(0, Math.min(span, range[1] - bounds.min)),
        ]
      : [0, 0];

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-sm sm:p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Фільтри каталогу
        </span>
      </div>
      <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:gap-10">
        <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:gap-6">
          <div className="flex min-w-[10rem] flex-1 flex-col gap-2">
            <Label htmlFor="catalog-filter-color" className="text-xs text-muted-foreground">
              Колір
            </Label>
            <select
              id="catalog-filter-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={selectClass}
            >
              <option value="">Усі кольори</option>
              {options.colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[10rem] flex-1 flex-col gap-2">
            <Label htmlFor="catalog-filter-size" className="text-xs text-muted-foreground">
              Розмір
            </Label>
            <select
              id="catalog-filter-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className={selectClass}
            >
              <option value="">Усі розміри</option>
              {options.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {bounds && bounds.max > bounds.min ? (
          <div className="min-w-0 flex-1 space-y-3 xl:max-w-md">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Label>Ціна, ₴</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {Math.min(range[0], range[1]).toLocaleString('uk-UA')} —{' '}
                {Math.max(range[0], range[1]).toLocaleString('uk-UA')}
              </span>
            </div>
            <Slider
              min={0}
              max={span}
              step={span > 500 ? 10 : 1}
              value={sliderValue}
              onValueChange={(v) => {
                const a = bounds.min + v[0];
                const b = bounds.min + v[1];
                setRange([Math.min(a, b), Math.max(a, b)]);
              }}
              className="py-1"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price-min-inp" className="text-xs text-muted-foreground">
                  Від
                </Label>
                <Input
                  id="price-min-inp"
                  type="number"
                  min={bounds.min}
                  max={bounds.max}
                  inputMode="numeric"
                  value={range[0]}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    const next = Math.round(Math.max(bounds.min, Math.min(n, bounds.max)));
                    setRange([next, Math.max(next, range[1])]);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price-max-inp" className="text-xs text-muted-foreground">
                  До
                </Label>
                <Input
                  id="price-max-inp"
                  type="number"
                  min={bounds.min}
                  max={bounds.max}
                  inputMode="numeric"
                  value={range[1]}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    const next = Math.round(Math.min(bounds.max, Math.max(n, bounds.min)));
                    setRange([Math.min(range[0], next), next]);
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end xl:flex-col xl:items-stretch">
          <Button type="submit" className="min-h-10 min-w-[9rem]">
            Застосувати
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-10 min-w-[9rem] border-input"
            onClick={reset}
          >
            Скинути
          </Button>
        </div>
      </div>
    </form>
  );
}
