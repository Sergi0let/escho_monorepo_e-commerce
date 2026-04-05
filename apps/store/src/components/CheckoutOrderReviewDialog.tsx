'use client';

import { COD_ADVANCE_UAH, type FormDataType } from '@/components/CheckoutForm';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { formatUah } from '@/lib/format';
import type { CartLine } from '@/store/cart-store';
import { AlertTriangle, Loader2, Phone } from 'lucide-react';

function paymentLabel(paymentType: string): string {
	if (paymentType === 'payNoCash') return 'Безготівковий розрахунок';
	if (paymentType === 'payAfterGetting') return 'Оплата при отриманні товару';
	return paymentType;
}

function deliverySummary(data: FormDataType): string {
	if (data.deliveryType === 'Nova Poshta') {
		return `${data.deliveryType} · ${data.deliveryCity ?? ''} · ${data.deliveryAddress}`;
	}
	if (data.deliveryType === 'Самовивіз') {
		return `${data.deliveryType} · ${data.deliveryAddress}`;
	}
	if (data.deliveryType === 'Інший варіант') {
		return `Інший варіант · ${data.deliveryAddress}`;
	}
	return data.deliveryType || '—';
}

export type CheckoutOrderReviewDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: FormDataType | null;
	lines: CartLine[];
	subtotal: number;
	onConfirm: () => void | Promise<void>;
	submitting: boolean;
	error: string | null;
};

export function CheckoutOrderReviewDialog({
	open,
	onOpenChange,
	formData,
	lines,
	subtotal,
	onConfirm,
	submitting,
	error,
}: CheckoutOrderReviewDialogProps) {
	const data = formData;
	const isCod = data?.paymentType === 'payAfterGetting';
	const isNpBranch = data?.deliveryType === 'Nova Poshta';

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next && submitting) return;
				onOpenChange(next);
			}}>
			<DialogContent
				className='gap-0 overflow-hidden p-0'
				onPointerDownOutside={(e) => submitting && e.preventDefault()}
				onEscapeKeyDown={(e) => submitting && e.preventDefault()}>
				<DialogHeader>
					<DialogTitle>Перевірте замовлення</DialogTitle>
					<DialogDescription>
						Переконайтесь, що телефон і спосіб оплати вказані правильно — після
						відправки з вами зв&apos;яжуться за цим номером.
					</DialogDescription>
				</DialogHeader>

				{data ? (
					<div className='max-h-[min(52vh,24rem)] space-y-4 overflow-y-auto px-6 py-2'>
						<section
							className='bg-primary/10 border-primary/25 rounded-lg border p-4'
							aria-labelledby='review-phone-label'>
							<p
								id='review-phone-label'
								className='text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide'>
								<Phone className='text-primary size-3.5 shrink-0' aria-hidden />
								Ваш телефон
							</p>
							<p className='text-foreground mt-2 text-xl font-semibold tabular-nums sm:text-2xl'>
								{data.phone || '—'}
							</p>
							<p className='text-muted-foreground mt-1 text-xs'>
								{data.name} {data.lastname}
								{data.mail.trim()
									? ` · ${data.mail}`
									: ' · email не вказано'}
							</p>
						</section>

						<section className='space-y-2'>
							<h3 className='text-foreground text-sm font-semibold'>Оплата</h3>
							<p className='text-foreground text-base font-medium'>
								{paymentLabel(data.paymentType)}
							</p>

							{isCod ? (
								<div
									role='status'
									className={
										isNpBranch
											? 'border-amber-500/40 bg-amber-500/10 rounded-lg border p-4'
											: 'border-primary/20 bg-primary/5 rounded-lg border p-4'
									}>
									{isNpBranch ? (
										<p className='text-foreground flex items-start gap-2 text-sm font-semibold'>
											<AlertTriangle
												className='text-amber-600 dark:text-amber-400 mt-0.5 size-4 shrink-0'
												aria-hidden
											/>
											Отримання у відділенні Нової пошти
										</p>
									) : (
										<p className='text-foreground text-sm font-semibold'>
											Аванс перед оплатою решти
										</p>
									)}
									<p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
										Спочатку потрібно сплатити{' '}
										<strong className='text-foreground font-semibold'>
											аванс {COD_ADVANCE_UAH} грн
										</strong>
										. Решту ви доплачуєте при отриманні (аванс віднімається від суми
										на пошті). Якщо посилку не заберете — аванс іде на доставку /
										повернення.
									</p>
								</div>
							) : null}
						</section>

						<section className='space-y-1'>
							<h3 className='text-foreground text-sm font-semibold'>Доставка</h3>
							<p className='text-muted-foreground text-sm leading-relaxed'>
								{deliverySummary(data)}
							</p>
						</section>

						{data.comment?.trim() ? (
							<section className='space-y-1'>
								<h3 className='text-foreground text-sm font-semibold'>Коментар</h3>
								<p className='text-muted-foreground text-sm whitespace-pre-wrap'>
									{data.comment.trim()}
								</p>
							</section>
						) : null}

						<section className='space-y-2'>
							<h3 className='text-foreground text-sm font-semibold'>Товари</h3>
							<ul className='divide-border divide-y rounded-lg border border-border bg-card text-sm'>
								{lines.map((l) => (
									<li
										key={l.lineId}
										className='text-foreground flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5'>
										<span className='min-w-0 flex-1'>
											{l.title}
											<span className='text-muted-foreground'>
												{' '}
												— {l.colorName}
												{l.sizeLabel ? ` (${l.sizeLabel})` : ''}
											</span>
										</span>
										<span className='tabular-nums'>
											{l.qty} × {formatUah(l.price)}
										</span>
									</li>
								))}
							</ul>
							<p className='text-foreground flex items-center justify-between border-t border-border pt-3 text-base font-semibold'>
								Разом
								<span className='font-display tabular-nums text-lg'>
									{formatUah(subtotal)}
								</span>
							</p>
						</section>
					</div>
				) : null}

				{error ? (
					<p
						className='text-destructive border-destructive/30 bg-destructive/10 mx-6 mb-2 rounded-md border px-3 py-2 text-sm'
						role='alert'>
						{error}
					</p>
				) : null}

				<DialogFooter className='flex-col gap-2 sm:flex-col sm:space-x-0'>
					<Button
						type='button'
						size='lg'
						className='inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 font-semibold sm:w-full'
						disabled={submitting || !data}
						onClick={() => void onConfirm()}>
						{submitting ? (
							<>
								<Loader2 className='size-4 shrink-0 animate-spin' aria-hidden />
								Відправка…
							</>
						) : (
							'Підтверджую замовлення'
						)}
					</Button>
					<Button
						type='button'
						variant='outline'
						size='lg'
						className='h-11 w-full cursor-pointer'
						disabled={submitting}
						onClick={() => onOpenChange(false)}>
						Повернутися до редагування
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
