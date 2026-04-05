'use client';

import Link from 'next/link';
import { ChevronDown, LayoutGrid, Menu } from 'lucide-react';
import type { CategoryRow } from '@/lib/queries';
import { headerNavLinks, shopInfoLinks } from '@/lib/site-nav';
import { useCartTotals } from '@/store/cart-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinkClass =
  'rounded-md px-2.5 py-2 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-muted/70 hover:text-foreground xl:px-3 xl:text-sm';

type Props = {
  categories: CategoryRow[];
};

export function HeaderNav({ categories }: Props) {
  const { count } = useCartTotals();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/78">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 py-3.5 lg:gap-4 lg:py-4">
          <Link
            href="/"
            className="group flex min-w-0 shrink-0 flex-col leading-none transition-opacity hover:opacity-85"
          >
            <span className="font-display text-lg tracking-[-0.02em] text-foreground sm:text-xl lg:text-2xl">
              Є що
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
              обране поруч
            </span>
          </Link>

          <nav
            aria-label="Головна навігація"
            className="mx-2 hidden min-h-[2.75rem] min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto lg:flex xl:gap-1"
          >
            {headerNavLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={cn(navLinkClass, 'shrink-0')}>
                {label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto shrink-0 gap-1 rounded-md px-2.5 py-2 text-[13px] font-semibold text-foreground hover:bg-muted/70 xl:px-3 xl:text-sm"
                >
                  <LayoutGrid className="size-4 opacity-70" />
                  Категорії
                  <ChevronDown className="size-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-[min(70vh,28rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto">
                <DropdownMenuLabel className="text-xs font-normal uppercase tracking-wider text-muted-foreground">
                  Розділи каталогу
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.length === 0 ? (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    Після імпорту фіду тут зʼявляться категорії
                  </DropdownMenuItem>
                ) : (
                  categories.map((c) => (
                    <DropdownMenuItem key={c.id} asChild className="cursor-pointer">
                      <Link href={`/category/${c.id}`} className="w-full">
                        {c.name}
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/#catalog" className="w-full font-medium">
                    Усі позиції на головній →
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="default"
              asChild
              className="relative h-10 rounded-md px-3 text-[13px] font-semibold sm:px-4 sm:text-sm"
            >
              <Link href="/cart" className="relative">
                Кошик
                {count > 0 && (
                  <Badge
                    className="absolute -right-2 -top-2 flex h-5 min-w-5 justify-center px-1 text-[10px]"
                    variant="default"
                  >
                    {count > 99 ? '99+' : count}
                  </Badge>
                )}
              </Link>
            </Button>

            <Sheet modal>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-md border-foreground/12 lg:hidden"
                  aria-label="Відкрити меню"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Меню</SheetTitle>
                </SheetHeader>
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-8 pt-2 thin-scrollbar">
                  <nav className="flex flex-col gap-0.5 border-b border-border/60 pb-6">
                    {headerNavLinks.map(({ href, label }) => (
                      <SheetClose asChild key={href}>
                        <Link
                          href={href}
                          className="rounded-md px-3 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted/80"
                        >
                          {label}
                        </Link>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <Link
                        href="/cart"
                        className="rounded-md px-3 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted/80"
                      >
                        Кошик {count > 0 ? `(${count})` : ''}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/checkout"
                        className="rounded-md px-3 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted/80"
                      >
                        Оформлення замовлення
                      </Link>
                    </SheetClose>
                  </nav>

                  <div>
                    <p className="eyebrow mb-3">Категорії</p>
                    <div className="flex max-h-[36vh] flex-col gap-0.5 overflow-y-auto pr-1">
                      {categories.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Список зʼявиться після імпорту каталогу.</p>
                      ) : (
                        categories.map((c) => (
                          <SheetClose asChild key={c.id}>
                            <Link
                              href={`/category/${c.id}`}
                              className="rounded-md px-3 py-2.5 text-sm leading-snug text-foreground transition-colors hover:bg-muted/70"
                            >
                              {c.name}
                            </Link>
                          </SheetClose>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="eyebrow mb-3">Додатково</p>
                    <div className="flex flex-col gap-0.5">
                      {shopInfoLinks
                        .filter((l) => !headerNavLinks.some((h) => h.href === l.href))
                        .map(({ href, label }) => (
                          <SheetClose asChild key={href}>
                            <Link
                              href={href}
                              className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                            >
                              {label}
                            </Link>
                          </SheetClose>
                        ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
