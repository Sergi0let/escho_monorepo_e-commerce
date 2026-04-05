'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { Keyboard, Zoom } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import 'swiper/css';
import 'swiper/css/zoom';

type Props = {
	urls: string[];
	alt: string;
	colorKey: string;
	onActiveUrlChange?: (url: string | null) => void;
};

export function ProductGallerySwiper({
	urls,
	alt,
	colorKey,
	onActiveUrlChange,
}: Props) {
	const list = useMemo(() => [...new Set(urls.filter(Boolean))], [urls]);
	const mainRef = useRef<SwiperType | null>(null);
	const thumbStripRef = useRef<HTMLDivElement>(null);
	const cbRef = useRef(onActiveUrlChange);
	cbRef.current = onActiveUrlChange;

	const [activeIndex, setActiveIndex] = useState(0);
	const [reduceMotion, setReduceMotion] = useState(false);
	const urlsKey = list.join('|');

	const emitUrl = useCallback(
		(swiper: SwiperType) => {
			const idx = swiper.activeIndex;
			setActiveIndex(idx);
			cbRef.current?.(list[idx] ?? null);
		},
		[list],
	);

	useEffect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		setReduceMotion(mq.matches);
		const onChange = () => setReduceMotion(mq.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	}, []);

	/** Новий колір / набір URL — скидаємо на перший слайд */
	useEffect(() => {
		const s = mainRef.current;
		if (!s || list.length === 0) return;
		try {
			s.slideTo(0, reduceMotion ? 0 : 300);
		} catch {
			/* */
		}
		setActiveIndex(0);
		cbRef.current?.(list[0] ?? null);
	}, [colorKey, urlsKey, reduceMotion]);

	if (!list.length) {
		return (
			<div className='flex aspect-[3/4] w-full items-center justify-center rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground min-[480px]:aspect-[4/5] min-[480px]:rounded-xl'>
				Немає фото
			</div>
		);
	}

	return (
		<div className='space-y-2 min-[480px]:space-y-3'>
			<div className='product-gallery-frame relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-white min-[480px]:aspect-[4/5] min-[480px]:rounded-xl'>
				{/* Стрілки керують головним Swiper (завжди через ref, не закриття з минулого рендеру) */}
				{list.length > 1 ? (
					<>
						<Button
							type='button'
							variant='outline'
							size='icon'
							className='absolute left-1 top-1/2 z-10 h-9 w-9 -translate-y-1/2 cursor-pointer rounded-full border-border/80 bg-card/90 shadow-sm backdrop-blur-sm min-[480px]:left-2'
							aria-label='Попереднє фото'
							onClick={() => mainRef.current?.slidePrev()}>
							<ChevronLeft className='size-4' />
						</Button>
						<Button
							type='button'
							variant='outline'
							size='icon'
							className='absolute right-1 top-1/2 z-10 h-9 w-9 -translate-y-1/2 cursor-pointer rounded-full border-border/80 bg-card/90 shadow-sm backdrop-blur-sm min-[480px]:right-2'
							aria-label='Наступне фото'
							onClick={() => mainRef.current?.slideNext()}>
							<ChevronRight className='size-4' />
						</Button>
					</>
				) : null}

				<Swiper
					modules={[Zoom, Keyboard]}
					zoom={{ maxRatio: 3, minRatio: 1, toggle: true }}
					keyboard={{ enabled: true }}
					speed={reduceMotion ? 0 : 320}
					slidesPerView={1}
					spaceBetween={0}
					className='product-gallery-main absolute inset-0  !w-full'
					onSwiper={(s: SwiperType) => {
						mainRef.current = s;
						emitUrl(s);
					}}
					onSlideChange={emitUrl}>
					{list.map((url) => (
						<SwiperSlide
							key={url}
							className='!flex  items-center justify-center'>
							{/* Один клас swiper-zoom-container; без touch-pan-y — він ламав горизонтальний свайп */}
							<div className='swiper-zoom-container'>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={url}
									alt={alt}
									className='product-gallery-zoom-img max-h-full max-w-full object-contain'
									draggable={false}
								/>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>

			{list.length > 1 && (
				<div className='flex items-center gap-2'>
					<Button
						type='button'
						variant='outline'
						size='icon'
						className='h-9 w-9 shrink-0 cursor-pointer rounded-full border-border shadow-sm'
						aria-label='Прокрутити мініатюри вліво'
						onClick={() =>
							thumbStripRef.current?.scrollBy({ left: -88, behavior: 'smooth' })
						}>
						<ChevronLeft className='size-4' />
					</Button>

					<div
						ref={thumbStripRef}
						className='thin-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto py-1'
						role='listbox'
						aria-label='Мініатюри фото'>
						{list.map((url, i) => {
							const active = i === activeIndex;
							return (
								<button
									key={`${url}-thumb-${i}`}
									type='button'
									role='option'
									aria-selected={active}
									className={cn(
										'relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 bg-muted/30 transition-colors duration-200 min-[480px]:h-16 min-[480px]:w-16 min-[480px]:rounded-lg',
										active
											? 'border-[#2563eb] ring-2 ring-[#2563eb]/25'
											: 'border-transparent opacity-80 hover:border-border hover:opacity-100',
									)}
									onClick={() => {
										mainRef.current?.slideTo(i);
									}}>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={url}
										alt=''
										className='h-full w-full object-cover'
										draggable={false}
									/>
								</button>
							);
						})}
					</div>

					<Button
						type='button'
						variant='outline'
						size='icon'
						className='h-9 w-9 shrink-0 cursor-pointer rounded-full border-border shadow-sm'
						aria-label='Прокрутити мініатюри вправо'
						onClick={() =>
							thumbStripRef.current?.scrollBy({ left: 88, behavior: 'smooth' })
						}>
						<ChevronRight className='size-4' />
					</Button>
				</div>
			)}

			<p className='text-center text-[10px] leading-snug text-muted-foreground min-[480px]:hidden'>
				Горизонтальний свайп або стрілки — інше фото. Подвійний тап —
				збільшення.
			</p>
			<p className='hidden text-center text-xs leading-snug text-muted-foreground min-[480px]:block'>
				Свайп або стрілки для перемикання. Подвійний клік / подвійний тап по
				фото — збільшення.
			</p>
		</div>
	);
}
