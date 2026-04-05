'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

type Props = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

const thumbClass =
  'block size-4 cursor-pointer rounded-full border-2 border-primary bg-background shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const Slider = React.forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, Props>(
  ({ className, ...props }, ref) => {
    const n =
      props.value?.length ?? props.defaultValue?.length ?? 1;
    const thumbs = Math.min(2, Math.max(1, n));
    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn('relative flex w-full touch-none select-none items-center', className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {thumbs === 2 ? (
          <>
            <SliderPrimitive.Thumb className={thumbClass} aria-label="Мінімальне значення" />
            <SliderPrimitive.Thumb className={thumbClass} aria-label="Максимальне значення" />
          </>
        ) : (
          <SliderPrimitive.Thumb className={thumbClass} />
        )}
      </SliderPrimitive.Root>
    );
  },
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
