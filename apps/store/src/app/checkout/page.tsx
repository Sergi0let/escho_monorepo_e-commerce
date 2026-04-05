'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { CheckoutForm, type FormDataType } from '@/components/CheckoutForm';
import { CheckoutOrderReviewDialog } from '@/components/CheckoutOrderReviewDialog';
import { formatUah } from '@/lib/format';
import { useCartStore, useCartTotals } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CheckoutPage() {
	const router = useRouter();
	const lines = useCartStore((s) => s.lines);
	const clear = useCartStore((s) => s.clear);
	const { subtotal } = useCartTotals();
	const [done, setDone] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [formValid, setFormValid] = useState(false);
	const [reviewOpen, setReviewOpen] = useState(false);
	const [pendingData, setPendingData] = useState<FormDataType | null>(null);

	const onReviewRequested = useCallback((formData: FormDataType) => {
		setSubmitError(null);
		setPendingData(formData);
		setReviewOpen(true);
	}, []);

	const confirmOrder = useCallback(async () => {
		if (!pendingData) return;
		setSubmitError(null);
		setSubmitting(true);
		try {
			const items = lines.map((l) => ({
				name: `${l.title} — ${l.colorName}${l.sizeLabel ? ` (${l.sizeLabel})` : ''}`,
				price: l.price,
				quantity: l.qty,
			}));

			const res = await fetch('/api/send-order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lastname: pendingData.lastname,
					name: pendingData.name,
					phone: pendingData.phone,
					mail: pendingData.mail,
					deliveryType: pendingData.deliveryType,
					deliveryCity: pendingData.deliveryCity ?? '',
					deliveryAddress: pendingData.deliveryAddress,
					paymentType: pendingData.paymentType,
					comment: pendingData.comment,
					items,
					totalPrice: subtotal,
				}),
			});

			const json = (await res.json().catch(() => ({}))) as { message?: string };
			if (!res.ok) {
				throw new Error(json.message ?? `Помилка ${res.status}`);
			}

			clear();
			setReviewOpen(false);
			setPendingData(null);
			setDone(true);
			router.refresh();
		} catch (e) {
			setSubmitError(
				e instanceof Error ? e.message : 'Не вдалося відправити замовлення',
			);
		} finally {
			setSubmitting(false);
		}
	}, [clear, lines, pendingData, router, subtotal]);

	if (done) {
		return (
			<div className="mx-auto max-w-lg space-y-6 py-12 text-center">
				<h1 className="font-display text-3xl text-foreground">Дякуємо!</h1>
				<p className="text-muted-foreground">
					Замовлення прийнято. Якщо налаштовано пошту, ви отримаєте лист із підтвердженням.
				</p>
				<Button asChild size="lg" className="h-12 rounded-md px-8 font-semibold">
					<Link href="/">На головну</Link>
				</Button>
			</div>
		);
	}

	if (!lines.length) {
		return (
			<div className="mx-auto max-w-lg space-y-6 py-12 text-center">
				<h1 className="font-display text-3xl text-foreground">Немає позицій</h1>
				<p className="text-muted-foreground">Спочатку додайте товари в кошик.</p>
				<Button asChild variant="outline" size="lg" className="h-12 rounded-md px-8 font-semibold">
					<Link href="/cart">До кошика</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-8">
			<div>
				<h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
					Оформлення замовлення
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Контакти, доставка (Нова пошта через API), оплата. Після відправки кошик очиститься.
				</p>
			</div>

			<Card className="border-border/80 shadow-soft">
				<CardContent className="space-y-1 p-6">
					<p className="text-sm text-muted-foreground">До сплати</p>
					<p className="font-display text-2xl font-normal tabular-nums text-foreground">
						{subtotal} UAH
					</p>
					<p className="text-xs text-muted-foreground">{lines.length} позицій</p>
				</CardContent>
			</Card>

			<Card className="border-border/80 shadow-soft">
				<CardContent className="p-4 sm:p-6">
					{submitError ? (
						<p
							className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
							role="alert">
							{submitError}
						</p>
					) : null}
					<CheckoutForm
						isSubmitting={false}
						onValidityChange={setFormValid}
						onReviewRequested={onReviewRequested}
					/>
					<div className="mt-6 border-t border-border pt-6">
						<Button
							type="submit"
							form="checkout-form"
							size="lg"
							disabled={!formValid || submitting || reviewOpen}
							className="h-12 w-full rounded-md text-[15px] font-semibold">
							Підтвердити замовлення
						</Button>
						{!formValid ? (
							<p className="mt-2 text-center text-xs text-muted-foreground">
								Заповніть усі кроки оформлення, щоб активувати кнопку.
							</p>
						) : null}
					</div>
				</CardContent>
			</Card>

			<CheckoutOrderReviewDialog
				open={reviewOpen}
				onOpenChange={(o) => {
					setReviewOpen(o);
					if (!o && !submitting) {
						setSubmitError(null);
					}
				}}
				formData={pendingData}
				lines={lines}
				subtotal={subtotal}
				onConfirm={confirmOrder}
				submitting={submitting}
				error={submitError}
			/>
		</div>
	);
}
