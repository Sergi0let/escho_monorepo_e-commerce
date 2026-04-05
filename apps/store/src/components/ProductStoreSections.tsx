import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  descriptionHtml?: string | null;
};

/** Фіксоване місце під власний SVG / логотип (підставте `<svg>…</svg>` або `<Image src="…svg" />` як children). */
export function PolicyIconSlot({
  className,
  children,
  label = 'Іконка або логотип (SVG)',
}: {
  className?: string;
  children?: ReactNode;
  /** Короткий підпис для aria, якщо слот порожній */
  label?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/15 text-muted-foreground',
        className,
      )}
      aria-label={children ? undefined : label}
    >
      {children ?? (
        <span className="select-none px-1 text-center text-[9px] font-medium uppercase leading-tight tracking-wide text-muted-foreground/70">
          SVG
        </span>
      )}
    </div>
  );
}

export function ProductStoreSections({ descriptionHtml }: Props) {
  return (
    <div className="space-y-8 border-t border-border pt-8">
      <section id="sec-desc" aria-labelledby="heading-sec-desc" className="scroll-mt-24 space-y-4">
        <h2 id="heading-sec-desc" className="section-heading flex items-center gap-3">
          <PolicyIconSlot label="Опис товару — SVG" />
          Опис товару
        </h2>
        {descriptionHtml ? (
          <div
            className="prose-product max-w-none text-sm leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        ) : null}
      </section>

      <section id="sec-delivery" aria-labelledby="heading-sec-delivery" className="scroll-mt-24 space-y-3">
        <h2 id="heading-sec-delivery" className="section-heading flex items-center gap-3">
          <PolicyIconSlot label="Доставка — SVG" />
          Доставка
        </h2>

        <ul className="list-none space-y-2 md:hidden">
          <li className="flex gap-3 rounded-lg border border-border bg-background p-3.5">
            <PolicyIconSlot className="self-start" label="Нова Пошта — SVG" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-foreground">Нова Пошта</div>
              <p className="mt-1 text-xs text-muted-foreground">Самовивіз або кур&apos;єром</p>
              <dl className="mt-3 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 text-xs">
                <dt className="text-muted-foreground">Термін</dt>
                <dd className="text-foreground">1–5 днів</dd>
                <dt className="text-muted-foreground">Вартість</dt>
                <dd className="text-foreground">За тарифами перевізника</dd>
              </dl>
            </div>
          </li>
          <li className="flex gap-3 rounded-lg border border-border bg-background p-3.5">
            <PolicyIconSlot className="self-start" label="Нова Пошта / Укрпошта — SVG" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-foreground">Нова Пошта / Укрпошта</div>
              <p className="mt-1 text-xs text-muted-foreground">З пунктів видачі</p>
              <dl className="mt-3 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 text-xs">
                <dt className="text-muted-foreground">Термін</dt>
                <dd className="text-foreground">2–7 днів</dd>
                <dt className="text-muted-foreground">Вартість</dt>
                <dd className="text-foreground">За тарифами перевізника</dd>
              </dl>
            </div>
          </li>
        </ul>

        <div className="hidden overflow-hidden rounded-lg border border-border md:block">
          <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-14 px-2 py-2.5 font-semibold text-foreground" scope="col">
                  <span className="sr-only">Іконка</span>
                </th>
                <th className="px-3 py-2.5 font-semibold text-foreground">Спосіб доставки</th>
                <th className="px-3 py-2.5 font-semibold text-foreground">Термін</th>
                <th className="px-3 py-2.5 font-semibold text-foreground">Вартість</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/80">
                <td className="align-middle px-2 py-2.5">
                  <PolicyIconSlot className="mx-auto h-10 w-10" label="Нова Пошта — SVG" />
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium text-foreground">Нова Пошта</div>
                  <div className="mt-0.5 text-xs">Самовивіз або кур&apos;єром</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">1–5 днів</td>
                <td className="px-3 py-2.5">За тарифами перевізника</td>
              </tr>
              <tr>
                <td className="align-middle px-2 py-2.5">
                  <PolicyIconSlot className="mx-auto h-10 w-10" label="Укрпошта / відділення — SVG" />
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium text-foreground">Нова Пошта / Укрпошта</div>
                  <div className="mt-0.5 text-xs">З пунктів видачі</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">2–7 днів</td>
                <td className="px-3 py-2.5">За тарифами перевізника</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="sec-pay" aria-labelledby="heading-sec-pay" className="scroll-mt-24 space-y-4">
        <h2 id="heading-sec-pay" className="section-heading flex items-center gap-3">
          <PolicyIconSlot label="Оплата — SVG" />
          Оплата
        </h2>
        <ul className="space-y-5 text-sm leading-relaxed text-muted-foreground">
          <li className="flex gap-3">
            <PolicyIconSlot className="self-start" label="Оплата при отриманні — SVG" />
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-base font-semibold text-foreground">Оплата при отриманні</h3>
              <p>
                Розраховуйтесь за товар безпосередньо під час отримання. Переконайтеся в якості перед
                оплатою та обирайте зручний спосіб: готівкою або карткою.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <PolicyIconSlot className="self-start" label="Аванс — SVG" />
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 flex flex-wrap items-baseline gap-x-2 text-base font-semibold text-foreground">
                Аванс 100 грн
                <span className="text-xs font-normal normal-case text-muted-foreground">
                  Чому потрібен аванс?
                </span>
              </h3>
              <p>
                Забираєте посилку — аванс віднімаємо від оплати на пошті. Не забрали — аванс йде на
                витрати доставки/повернення.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <PolicyIconSlot className="self-start" label="Безготівковий розрахунок — SVG" />
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-base font-semibold text-foreground">Безготівковий розрахунок</h3>
              <p>
                Оплачуйте товар онлайн або через банк без зайвих клопотів. Доступна оплата з ПДВ для
                юридичних осіб.
              </p>
            </div>
          </li>
        </ul>
      </section>

      <section id="sec-warranty" aria-labelledby="heading-sec-warranty" className="scroll-mt-24 space-y-2">
        <h2 id="heading-sec-warranty" className="section-heading flex items-center gap-3">
          <PolicyIconSlot label="Гарантія — SVG" />
          Гарантія
        </h2>
        <p className="pl-14 text-sm leading-relaxed text-muted-foreground md:pl-[3.75rem]">
          Ви можете повернути або обміняти товар протягом 14 днів.
        </p>
      </section>
    </div>
  );
}
