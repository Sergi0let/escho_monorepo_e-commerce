import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CatalogPagination } from '@/components/CatalogPagination';
import { ProductGrid } from '@/components/ProductGrid';
import {
  countProductsByCategory,
  getCatalogFilterOptions,
  getCategoryById,
  getProductsByCategory,
} from '@/lib/queries';
import { CatalogFilterBar } from '@/components/CatalogFilterBar';
import {
  CATALOG_PAGE_SIZE,
  catalogListingHref,
  parseCatalogListingSearchParams,
} from '@/lib/pagination';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  let categoryId: bigint;
  try {
    categoryId = BigInt(id);
  } catch {
    notFound();
  }

  const category = await getCategoryById(categoryId);
  if (!category) notFound();

  const sp = (await searchParams) ?? {};
  const { page, filters } = parseCatalogListingSearchParams(sp);
  const [total, filterOptions] = await Promise.all([
    countProductsByCategory(categoryId, filters),
    getCatalogFilterOptions(categoryId),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  if (page > totalPages) {
    redirect(catalogListingHref(`/category/${id}`, { page: totalPages, ...filters }));
  }
  const offset = (page - 1) * CATALOG_PAGE_SIZE;
  const products = await getProductsByCategory(
    categoryId,
    CATALOG_PAGE_SIZE,
    offset,
    filters,
  );

  return (
    <div className="space-y-12">
      <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Головна
        </Link>
        <span className="text-border" aria-hidden>
          /
        </span>
        <span className="max-w-[min(100%,28rem)] truncate text-foreground">{category.name}</span>
      </nav>

      <header className="space-y-4 border-b border-border pb-10">
        <p className="eyebrow">Розділ</p>
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl lg:text-[2.5rem]">
          {category.name}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Товари з категорії <strong className="font-medium text-foreground">{category.name}</strong>
          {category.parent_id && (
            <>
              {' '}
              <code className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-xs font-normal">
                id {id}
              </code>
            </>
          )}
        </p>
      </header>

      <CatalogFilterBar
        pathname={`/category/${id}`}
        filters={filters}
        options={filterOptions}
      />
      <ProductGrid products={products} />
      <CatalogPagination
        page={page}
        totalPages={totalPages}
        pathname={`/category/${id}`}
        filters={filters}
      />
    </div>
  );
}
