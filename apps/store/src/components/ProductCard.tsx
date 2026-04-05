'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useCallback, useState } from 'react';
import { getProductColorsWithSkus } from '@/lib/catalog-client';
import type {
	CatalogGridItem,
	ColorWithSkus,
	ProductColorCardItem,
} from '@/lib/queries';
import { formatUah, genderLabel } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/store/cart-store';

function isColorCard(p: CatalogGridItem): p is ProductColorCardItem {
	return 'product_id' in p && 'color_name' in p;
}

function pickSku(color: ColorWithSkus) {
	return color.skus.find((s) => s.available) ?? color.skus[0] ?? null;
}

function galleryHero(color: ColorWithSkus): string | null {
	const urls = [
		...new Set((color.image_urls ?? []).filter(Boolean)),
	] as string[];
	return urls[0] ?? null;
}

type Props = { product: CatalogGridItem };

export function ProductCard({ product }: Props) {
	const title = product.title?.trim() || 'Без назви';
	const subtitle = isColorCard(product) ? product.color_name : null;
	const href = isColorCard(product)
		? `/product/${product.product_id}?color=${encodeURIComponent(product.id)}`
		: `/product/${product.id}`;

	const addLine = useCartStore((s) => s.addLine);
	const [adding, setAdding] = useState(false);
	const [cartHint, setCartHint] = useState<string | null>(null);

	const onAddToCart = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setCartHint(null);
			const productId = isColorCard(product) ? product.product_id : product.id;
			setAdding(true);
			try {
				const colors = await getProductColorsWithSkus(productId);
				const color =
					(isColorCard(product)
						? colors.find((c) => c.id === product.id)
						: colors[0]) ?? colors[0];
				if (!color) {
					setCartHint('Немає варіантів товару');
					return;
				}
				const sku = pickSku(color);
				if (!sku) {
					setCartHint('Немає доступних розмірів');
					return;
				}
				const img = galleryHero(color) ?? product.thumb ?? null;
				addLine({
					barcode: sku.barcode,
					productId,
					title,
					colorName: color.color_name,
					sizeLabel: sku.size_label,
					price: parseFloat(sku.price),
					oldPrice: parseFloat(sku.old_price),
					image: img,
					qty: 1,
				});
			} catch {
				setCartHint('Не вдалося додати. Спробуйте зі сторінки товару');
			} finally {
				setAdding(false);
			}
		},
		[addLine, product, title],
	);

	return (
		<Card className='flex h-full flex-col justify-between overflow-hidden border-border/70 transition-colors duration-200 hover:border-foreground/20'>
			<Link href={href} className='group block cursor-pointer'>
				<div className='relative aspect-[3/4] bg-muted/60'>
					{product.thumb ? (
						<Image
							src={product.thumb}
							alt={title}
							fill
							className='object-cover transition duration-500 group-hover:opacity-[0.94]'
							sizes='(max-width: 768px) 100vw, 25vw'
						/>
					) : (
						<div className='flex h-full items-center justify-center font-display text-sm text-muted-foreground'>
							Немає фото
						</div>
					)}
					<Badge
						variant='secondary'
						className='absolute left-2.5 top-2.5 border border-border/50 bg-background/92 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-[2px]'>
						{genderLabel[product.gender] ?? product.gender}
					</Badge>
				</div>
				<CardContent className='flex flex-col gap-1.5 p-4 pb-3 sm:p-5 sm:pb-3'>
					{product.product_kind && (
						<span className='text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground'>
							{product.product_kind}
						</span>
					)}
					<h2 className='font-display text-lg font-normal leading-snug tracking-tight text-foreground transition-colors group-hover:text-foreground/90 md:text-xl'>
						{title}
					</h2>
					{subtitle && (
						<p className='text-sm text-muted-foreground'>
							<span className='font-medium text-foreground/90'>{subtitle}</span>
						</p>
					)}
					<p className='text-lg font-semibold tabular-nums text-foreground'>
						від {product.price_from}
					</p>
				</CardContent>
			</Link>
			<div className='mt-auto border-t border-border/40 px-4 pb-4 sm:px-5'>
				<Button
					type='button'
					variant='outline'
					size='sm'
					className='mt-3 h-10 w-full gap-2 rounded-md text-[13px] font-semibold'
					disabled={adding}
					aria-busy={adding}
					onClick={onAddToCart}>
					{adding ? (
						<Loader2 className='size-4 shrink-0 animate-spin' aria-hidden />
					) : (
						<ShoppingBag className='size-4 shrink-0' aria-hidden />
					)}
					До кошика
				</Button>
				{cartHint ? (
					<p
						className='mt-2 text-center text-xs text-destructive'
						role='status'>
						{cartHint}
					</p>
				) : null}
			</div>
		</Card>
	);
}
