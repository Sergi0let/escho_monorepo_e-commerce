import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  catalogListingHref,
  type CatalogListingFilters,
} from '@/lib/pagination';

type Props = {
  page: number;
  totalPages: number;
  /** Для головної — "/", для категорії — "/category/123" */
  pathname: string;
  filters?: CatalogListingFilters;
};

export function CatalogPagination({ page, totalPages, pathname, filters }: Props) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;
  const normalized = pathname === '' ? '/' : pathname;
  const fq = filters ?? {};

  return (
    <nav
      className="flex flex-col items-center gap-5 border-t border-border pt-10 sm:flex-row sm:justify-center sm:gap-8"
      aria-label="Пагінація каталогу"
    >
      <div className="flex items-center gap-2">
        {prev !== null ? (
          <Button variant="outline" size="sm" asChild className="rounded-md font-semibold">
            <Link href={catalogListingHref(normalized, { ...fq, page: prev })} rel="prev">
              ← Назад
            </Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="pointer-events-none rounded-md opacity-50"
          >
            ← Назад
          </Button>
        )}
        {next !== null ? (
          <Button variant="outline" size="sm" asChild className="rounded-md font-semibold">
            <Link href={catalogListingHref(normalized, { ...fq, page: next })} rel="next">
              Далі →
            </Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="pointer-events-none rounded-md opacity-50"
          >
            Далі →
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Сторінка <span className="font-medium text-foreground">{page}</span> з{' '}
        <span className="font-medium text-foreground">{totalPages}</span>
      </p>
    </nav>
  );
}
