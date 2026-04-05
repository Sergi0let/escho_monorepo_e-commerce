import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CatalogPagination } from '@/components/CatalogPagination';
import { CategoryChips } from '@/components/CategoryChips';
import { ProductGrid } from '@/components/ProductGrid';
import { Button } from '@/components/ui/button';
import { CatalogFilterBar } from '@/components/CatalogFilterBar';
import {
  CATALOG_PAGE_SIZE,
  catalogListingHref,
  parseCatalogListingSearchParams,
} from '@/lib/pagination';
import {
  countStockedProducts,
  getCatalogFilterOptions,
  getStockedProductsPage,
  getStorefrontNavCategories,
} from '@/lib/queries';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const { page, filters } = parseCatalogListingSearchParams(sp);
  const [total, categories, filterOptions] = await Promise.all([
    countStockedProducts(filters),
    getStorefrontNavCategories(40),
    getCatalogFilterOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  if (page > totalPages) {
    redirect(catalogListingHref('/', { page: totalPages, ...filters }));
  }
  const offset = (page - 1) * CATALOG_PAGE_SIZE;
  const products = await getStockedProductsPage(CATALOG_PAGE_SIZE, offset, filters);

  return (
    <div className="space-y-20 md:space-y-24">
      <section className="hero-grid relative overflow-hidden rounded-lg border border-border px-6 py-12 shadow-soft sm:px-10 sm:py-16 md:px-14 md:py-20">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-border/80 max-md:hidden" />
        <div className="relative max-w-2xl space-y-8">
          <p className="eyebrow">Є що · онлайн-каталог</p>
          <h1 className="font-display text-[2.125rem] font-normal leading-[1.12] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Оберіть з того,{' '}
            <span className="relative inline-block">
              <span className="relative z-[1]">що вже є</span>
              <span
                className="absolute -bottom-1 left-0 right-0 h-3 bg-foreground/10 max-sm:-bottom-0.5 max-sm:h-2"
                aria-hidden
              />
            </span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Категорії в меню, товари з вашої бази після XML-імпорту — колір, розмір і ціна на
            картці.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            <Button asChild size="lg" className="h-12 rounded-md px-8 text-[15px] font-semibold">
              <Link href="#catalog">До каталогу</Link>
            </Button>
            {categories[0] && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-md border-foreground/20 bg-transparent px-8 text-[15px] font-semibold hover:bg-muted/80"
              >
                <Link href={`/category/${categories[0].id}`}>Швидка категорія</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <CategoryChips categories={categories} />

      <section id="catalog" className="scroll-mt-28 space-y-10">
        <div className="flex flex-col gap-2 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2">Каталог</p>
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              Актуальні позиції
            </h2>
          </div>
        </div>
        <CatalogFilterBar pathname="/" filters={filters} options={filterOptions} />
        <ProductGrid products={products} />
        <CatalogPagination page={page} totalPages={totalPages} pathname="/" filters={filters} />
      </section>
    </div>
  );
}
