'use client';

import Image from 'next/image';
import { Banknote, Check, FileText, ShieldCheck, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ColorWithSkus, ProductDetail } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { formatUah } from '@/lib/format';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProductGallerySwiper } from '@/components/ProductGallerySwiper';

type Props = {
	product: ProductDetail;
	colors: ColorWithSkus[];
	/** UUID кольору з ?color= на сторінці товару (з картки «товар+колір»). */
	initialColorId?: string;
};

export function ProductPurchasePanel({ product, colors, initialColorId }: Props) {
	const router = useRouter();
	const [colorId, setColorId] = useState(() => {
		if (initialColorId && colors.some((c) => c.id === initialColorId)) {
			return initialColorId;
		}
		return colors[0]?.id ?? '';
	});
	const [activeGalleryUrl, setActiveGalleryUrl] = useState<string | null>(null);
	const onGalleryUrlChange = useCallback(
		(url: string | null) => setActiveGalleryUrl(url),
		[],
	);
	const addLine = useCartStore((s) => s.addLine);

	const color = useMemo(
		() => colors.find((c) => c.id === colorId) ?? colors[0],
		[colors, colorId],
	);

	const skus = color?.skus?.filter((s) => s.available) ?? [];
	const [barcode, setBarcode] = useState('');
	const purchaseCtaRef = useRef<HTMLDivElement>(null);
	const [showMobileCtaBar, setShowMobileCtaBar] = useState(false);
	const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setPortalEl(document.body);
	}, []);

	useEffect(() => {
		if (initialColorId && colors.some((c) => c.id === initialColorId)) {
			setColorId(initialColorId);
		}
	}, [initialColorId, colors]);

	useEffect(() => {
		const list = color?.skus?.filter((s) => s.available) ?? [];
		const b = list[0]?.barcode;
		if (b) setBarcode(b);
	}, [colorId, color]);

	useEffect(() => {
		const el = purchaseCtaRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([e]) => setShowMobileCtaBar(!e.isIntersecting),
			{ root: null, threshold: 0, rootMargin: '0px 0px -16px 0px' },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [colorId, barcode]);

	const sku = skus.find((s) => s.barcode === barcode) ?? skus[0];
	const galleryUrls = useMemo(
		() => [...new Set((color?.image_urls ?? []).filter(Boolean))] as string[],
		[color],
	);
	const hero = activeGalleryUrl ?? galleryUrls[0] ?? null;

	const priceNum = parseFloat(sku.price);
	const oldNum = parseFloat(sku.old_price);
	const hasDiscount =
		oldNum > priceNum && Number.isFinite(oldNum) && Number.isFinite(priceNum);
	const discountPct = hasDiscount
		? Math.round((1 - priceNum / oldNum) * 100)
		: 0;

	const title = product.title?.trim() || 'Без назви';

	if (!color || !sku) {
		return (
			<p className='text-muted-foreground'>
				Немає доступних варіантів для замовлення.
			</p>
		);
	}

	const cartLine = {
		barcode: sku.barcode,
		productId: product.id,
		title,
		colorName: color.color_name,
		sizeLabel: sku.size_label,
		price: parseFloat(sku.price),
		oldPrice: parseFloat(sku.old_price),
		image: hero ?? null,
		qty: 1 as const,
	};

	return (
		<>
			<div className='space-y-8 overflow-hidden'>
				<Card className='overflow-visible border-border/70 bg-card p-3 shadow-soft sm:p-4 lg:overflow-hidden lg:border-border/60'>
					<div className='w-full lg:max-w-none'>
						<ProductGallerySwiper
							urls={galleryUrls}
							alt={`${title} — ${color.color_name}`}
							colorKey={color.id}
							onActiveUrlChange={onGalleryUrlChange}
						/>
					</div>
				</Card>

				<div className='space-y-6'>
					<div>
						<p className='eyebrow'>Колір</p>
						<div className='mt-2 flex flex-wrap gap-2'>
							{colors.map((c) => {
								const thumb = c.image_urls?.[0];
								const active = c.id === color.id;
								return (
									<Button
										key={c.id}
										type='button'
										variant={active ? 'default' : 'outline'}
										className={cn(
											'h-auto min-h-10 justify-start gap-2 rounded-md py-2 pr-4',
											!active && 'border-border/80 bg-card',
										)}
										onClick={() => setColorId(c.id)}>
										{thumb && (
											<span className='relative h-10 w-10 shrink-0 overflow-hidden rounded-md'>
												<Image
													src={thumb}
													alt=''
													fill
													className='object-cover'
													sizes='40px'
												/>
											</span>
										)}
										{c.color_name}
									</Button>
								);
							})}
						</div>
					</div>

					<div>
						<p className='eyebrow'>Розмір</p>
						<div className='mt-2 flex flex-wrap gap-2'>
							{skus.map((s) => {
								const active = s.barcode === sku.barcode;
								return (
									<Button
										key={s.barcode}
										type='button'
										variant='outline'
										size='sm'
										className={cn(
											'min-h-10 min-w-[2.75rem] rounded-md border-2 px-3 font-semibold transition-colors',
											active
												? 'border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8] hover:text-white'
												: 'border-border bg-background text-foreground hover:bg-muted/60',
										)}
										onClick={() => setBarcode(s.barcode)}>
										{s.size_label ?? '—'}
									</Button>
								);
							})}
						</div>
					</div>

					<p className='flex items-center gap-2 text-sm font-medium text-emerald-700'>
						<span className='flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white'>
							<Check className='size-3.5 stroke-[3]' aria-hidden />
						</span>
						В наявності
					</p>

					<div className='flex flex-wrap items-center gap-3'>
						{hasDiscount && (
							<span className='rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white'>
								−{discountPct}%
							</span>
						)}
						<div className='flex flex-wrap items-baseline gap-3'>
							<span
								className={cn(
									'font-display text-3xl font-semibold tabular-nums',
									hasDiscount ? 'text-red-600' : 'text-foreground',
								)}>
								{/* {formatUah(sku.price)} */}
								{sku.price} UAH
							</span>
							{hasDiscount && (
								<span className='text-lg text-muted-foreground line-through'>
									{/* {formatUah(sku.old_price)} */}
									{sku.old_price} UAH
								</span>
							)}
						</div>
					</div>

					<div
						ref={purchaseCtaRef}
						className='flex flex-col gap-3 sm:flex-row sm:flex-wrap'>
						<Button
							type='button'
							size='lg'
							className='h-12 flex-1 rounded-md bg-emerald-600 text-[15px] font-bold uppercase tracking-wide text-white shadow-sm hover:bg-emerald-700 sm:min-w-[200px]'
							onClick={() => addLine(cartLine)}>
							Замовити
						</Button>
						<Button
							type='button'
							size='lg'
							variant='outline'
							className='h-12 flex-1 rounded-md border-2 border-[#2563eb]/40 bg-background text-[15px] font-semibold text-[#1e40af] hover:bg-[#2563eb]/5 sm:min-w-[200px]'
							onClick={() => {
								addLine(cartLine);
								router.push('/checkout');
							}}>
							Купити в 1 клік
						</Button>
					</div>
				</div>
			</div>

			{portalEl
				? createPortal(
						<div
							className={cn(
								'fixed inset-x-0 bottom-0 z-[100] md:hidden border-t border-border bg-card/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md transition-transform duration-300 ease-out',
								showMobileCtaBar
									? 'translate-y-0'
									: 'pointer-events-none translate-y-full',
							)}
							role='region'
							aria-label='Швидкі дії та умови'>
							<div className='mx-auto flex max-w-7xl flex-col gap-2 px-3 pt-2'>
								<div className='flex items-center justify-center gap-0.5 border-b border-border/60 pb-2'>
									<a
										href='#sec-desc'
										className='flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
										aria-label='Опис товару'>
										<FileText className='size-5' aria-hidden />
									</a>
									<a
										href='#sec-delivery'
										className='flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
										aria-label='Доставка'>
										<Truck className='size-5' aria-hidden />
									</a>
									<a
										href='#sec-pay'
										className='flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
										aria-label='Оплата'>
										<Banknote className='size-5' aria-hidden />
									</a>
									<a
										href='#sec-warranty'
										className='flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
										aria-label='Гарантія'>
										<ShieldCheck className='size-5' aria-hidden />
									</a>
								</div>
								<div className='flex items-center gap-2 pb-2'>
									<div className='min-w-0 flex-1'>
										<div className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
											Разом
										</div>
										<div
											className={cn(
												'font-display text-lg font-semibold tabular-nums leading-tight',
												hasDiscount ? 'text-red-600' : 'text-foreground',
											)}>
											{sku.price} UAH
										</div>
									</div>
									<Button
										type='button'
										size='sm'
										className='h-10 shrink-0 rounded-md bg-emerald-600 px-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700'
										onClick={() => addLine(cartLine)}>
										Замовити
									</Button>
									<Button
										type='button'
										size='sm'
										variant='outline'
										className='h-10 shrink-0 rounded-md border-2 border-[#2563eb]/40 px-3 text-xs font-semibold text-[#1e40af] hover:bg-[#2563eb]/5'
										onClick={() => {
											addLine(cartLine);
											router.push('/checkout');
										}}>
										1 клік
									</Button>
								</div>
							</div>
						</div>,
						portalEl,
					)
				: null}
		</>
	);
}
