import type { Metadata } from 'next';
import { Instrument_Serif, Manrope } from 'next/font/google';
import { CookieConsent } from '@/components/CookieConsent';
import { Footer } from '@/components/Footer';
import { SiteHeader } from '@/components/site-header';
import { cn } from '@/lib/utils';
import './globals.css';

const display = Instrument_Serif({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
});

const body = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Є що — каталог одягу',
  description: 'Онлайн-каталог: товари з PostgreSQL після XML-імпорту',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={cn(display.variable, body.variable)}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-6 sm:pb-28 sm:pt-12 lg:px-8">
          {children}
        </main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
