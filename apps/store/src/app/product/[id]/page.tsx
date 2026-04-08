import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductPurchasePanel } from '@/components/ProductPurchasePanel';
import { ProductStoreSections } from '@/components/ProductStoreSections';
import { ProductGrid } from '@/components/ProductGrid';
import { getProductById, getProductColorsWithSkus } from '@/lib/queries';
import { getFeaturedProductsBalanced } from '@/lib/queries';
import { genderLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ color?: string }>;
};

export default async function ProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const initialColorId =
    typeof sp.color === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sp.color,
    )
      ? sp.color
      : undefined;
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(id)) notFound();

  const [product, colors, featured] = await Promise.all([
    getProductById(id),
    getProductColorsWithSkus(id),
    getFeaturedProductsBalanced(12).catch(() => []),
  ]);
  if (!product) notFound();

  if (!colors.length) {
    notFound();
  }

  const featuredFiltered = featured.filter((p) => p.id !== id);

  return (
    <article className="space-y-12 pb-28 md:pb-0">
      <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Головна
        </Link>
        {product.category_id && product.category_name && (
          <>
            <span className="text-border" aria-hidden>
              /
            </span>
            <Link
              href={`/category/${product.category_id}`}
              className="max-w-[min(100%,12rem)] truncate transition-colors hover:text-foreground sm:max-w-xs"
            >
              {product.category_name}
            </Link>
          </>
        )}
        <span className="text-border" aria-hidden>
          /
        </span>
        <span className="max-w-[min(100%,20rem)] truncate text-foreground">
          {product.title ?? 'Товар'}
        </span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)] lg:items-start lg:gap-12 xl:gap-16">
        <ProductPurchasePanel product={product} colors={colors} initialColorId={initialColorId} />

        <div className="space-y-8 lg:border-l lg:border-border/70 lg:pl-8 xl:pl-11">
          <p className="eyebrow">
            {genderLabel[product.gender] ?? product.gender}
            {product.product_kind && (
              <>
                {' · '}
                {product.product_kind}
              </>
            )}
          </p>
          <h1 className="font-display text-3xl font-normal leading-[1.15] tracking-tight text-foreground md:text-4xl lg:text-[2.75rem]">
            {product.title?.trim() || 'Без назви'}
          </h1>

          <dl className="space-y-5">
            {product.brand && (
              <div>
                <dt className="eyebrow">Бренд</dt>
                <dd className="mt-2 text-base text-foreground">{product.brand}</dd>
              </div>
            )}
            {product.fabric && (
              <div>
                <dt className="eyebrow">Тканина</dt>
                <dd className="mt-2 text-base text-foreground">{product.fabric}</dd>
              </div>
            )}
            {product.country && (
              <div>
                <dt className="eyebrow">Країна</dt>
                <dd className="mt-2 text-base text-foreground">{product.country}</dd>
              </div>
            )}
          </dl>

          <ProductStoreSections descriptionHtml={product.description} />
        </div>
      </div>

      {featuredFiltered.length ? (
        <section className="space-y-8">
          <div className="flex flex-col gap-2 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-2">Добірка</p>
              <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
                Рекомендовані товари
              </h2>
            </div>
          </div>
          <ProductGrid products={featuredFiltered} />
        </section>
      ) : null}
    </article>
  );
}
