'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatUah } from '@/lib/format';
import { useCartStore, useCartTotals } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CartPage() {
	const lines = useCartStore((s) => s.lines);
	const setQty = useCartStore((s) => s.setQty);
	const removeLine = useCartStore((s) => s.removeLine);
	const { subtotal } = useCartTotals();

	if (!lines.length) {
		return (
			<div className='mx-auto max-w-lg space-y-6 py-12 text-center'>
				<h1 className='font-display text-3xl font-normal tracking-tight text-foreground'>
					Кошик порожній
				</h1>
				<p className='text-muted-foreground'>
					Додайте товари з картки продукту.
				</p>
				<Button
					asChild
					size='lg'
					className='h-12 rounded-md px-8 font-semibold'>
					<Link href='/'>До каталогу</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className='space-y-10'>
			<h1 className='font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl'>
				Кошик
			</h1>

			<ul className='space-y-6'>
				{lines.map((line) => (
					<li key={line.lineId}>
						<Card className='overflow-hidden border-border/80 shadow-soft'>
							<CardContent className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center'>
								<div className='relative h-28 w-full shrink-0 overflow-hidden rounded-md bg-muted sm:h-24 sm:w-24'>
									{line.image ? (
										<Image
											src={line.image}
											alt=''
											fill
											className='object-cover'
											sizes='96px'
										/>
									) : (
										<div className='flex h-full items-center justify-center text-xs text-muted-foreground'>
											Немає фото
										</div>
									)}
								</div>
								<div className='min-w-0 flex-1'>
									<Link
										href={`/product/${line.productId}`}
										className='font-display text-lg font-normal text-foreground decoration-foreground/20 underline-offset-4 hover:underline'>
										{line.title}
									</Link>
									<p className='mt-1 text-sm text-muted-foreground'>
										{line.colorName}
										{line.sizeLabel && ` · розмір ${line.sizeLabel}`}
									</p>
									<p className='mt-2 font-semibold text-foreground'>
										{line.price} UAH
									</p>
								</div>
								<div className='flex items-center gap-3 sm:flex-col sm:items-end'>
									<div className='flex items-center rounded-md border border-border'>
										<Button
											type='button'
											variant='ghost'
											size='icon'
											className='rounded-none rounded-l-md'
											onClick={() => setQty(line.lineId, line.qty - 1)}
											aria-label='Зменшити'>
											−
										</Button>
										<span className='min-w-[2rem] text-center text-sm font-semibold'>
											{line.qty}
										</span>
										<Button
											type='button'
											variant='ghost'
											size='icon'
											className='rounded-none rounded-r-md'
											onClick={() => setQty(line.lineId, line.qty + 1)}
											aria-label='Додати'>
											+
										</Button>
									</div>
									<Button
										type='button'
										variant='link'
										className='text-destructive'
										onClick={() => removeLine(line.lineId)}>
										Видалити
									</Button>
								</div>
							</CardContent>
						</Card>
					</li>
				))}
			</ul>

			<div className='flex flex-col items-end gap-4 border-t border-border pt-8'>
				<p className='font-display text-2xl font-normal tabular-nums text-foreground'>
					Разом: <span className='text-foreground'>{subtotal} UAH</span>
				</p>
				<Button
					asChild
					size='lg'
					className='h-12 rounded-md px-8 font-semibold'>
					<Link href='/checkout'>Оформити замовлення</Link>
				</Button>
			</div>
		</div>
	);
}
