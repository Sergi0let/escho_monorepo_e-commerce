'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'escho-cookie-consent-v1';

export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const v = localStorage.getItem(STORAGE_KEY);
        if (!v) setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border/80 bg-card/95 p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90 sm:inset-x-4 sm:bottom-4 sm:rounded-xl sm:border"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 pr-8 sm:pr-0">
          <p id="cookie-consent-title" className="font-medium text-foreground">
            Файли cookie
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Ми використовуємо cookie для роботи кошика та зручності сайту. Продовжуючи, ви погоджуєтесь
            з нашою{' '}
            <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4 hover:no-underline">
              політикою конфіденційності
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <Button
            type="button"
            size="sm"
            className="h-10 rounded-md px-6 font-semibold"
            onClick={accept}
          >
            Прийняти
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-10 rounded-md font-medium" onClick={dismiss}>
            Пізніше
          </Button>
        </div>
      </div>
    </div>
  );
}
