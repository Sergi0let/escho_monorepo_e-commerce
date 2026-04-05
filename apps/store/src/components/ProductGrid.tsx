import type { CatalogGridItem } from '@/lib/queries';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from './ProductCard';

type Props = { products: CatalogGridItem[] };

export function ProductGrid({ products }: Props) {
  if (!products.length) {
    return (
      <Card className="border-dashed border-border/70 bg-muted/20">
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          У цій вибірці поки немає товарів. Імпортуйте фід або оберіть іншу категорію.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-10 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
