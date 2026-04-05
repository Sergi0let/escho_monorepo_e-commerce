import Link from 'next/link';
import { shopInfoLinks } from '@/lib/site-nav';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/70 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div>
            <p className="font-display text-2xl font-normal tracking-[-0.02em]">Є що</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-background/72">
              Онлайн-каталог одягу. Демо-магазин: кошик у браузері, оформлення без реальної оплати.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                asChild
                className="h-9 rounded-md border-0 bg-background/12 text-background hover:bg-background/20"
              >
                <Link href="/">Каталог</Link>
              </Button>
              <Button
                variant="secondary"
                asChild
                className="h-9 rounded-md border-0 bg-background/12 text-background hover:bg-background/20"
              >
                <Link href="/cart">Кошик</Link>
              </Button>
              <Button
                variant="secondary"
                asChild
                className="h-9 rounded-md border-0 bg-background/12 text-background hover:bg-background/20"
              >
                <Link href="/checkout">Оформлення</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:gap-12">
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-background/55">
                Покупцям
              </p>
              <ul className="space-y-2.5 text-sm">
                {shopInfoLinks.slice(0, 5).map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-background/75 transition-colors hover:text-background"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-background/55">
                Правові
              </p>
              <ul className="space-y-2.5 text-sm">
                {shopInfoLinks.slice(5).map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-background/75 transition-colors hover:text-background"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-12 border-t border-background/15 pt-8 text-xs text-background/48">
          © {new Date().getFullYear()} Є що · Демо-магазин
        </p>
      </div>
    </footer>
  );
}
