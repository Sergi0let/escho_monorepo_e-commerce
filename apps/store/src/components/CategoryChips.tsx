import Link from 'next/link';
import type { CategoryRow } from '@/lib/queries';
import { Button } from '@/components/ui/button';

type Props = { categories: CategoryRow[]; title?: string };

export function CategoryChips({ categories, title = 'Категорії' }: Props) {
  if (!categories.length) return null;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-2xl font-normal tracking-tight text-foreground md:text-3xl">
          {title}
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c.id}
            variant="outline"
            size="sm"
            asChild
            className="rounded-md border-border/90 font-medium"
          >
            <Link href={`/category/${c.id}`}>{c.name}</Link>
          </Button>
        ))}
      </div>
    </section>
  );
}
