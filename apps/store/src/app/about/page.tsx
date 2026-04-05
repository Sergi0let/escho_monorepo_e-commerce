import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Про нас — Є що',
  description: 'Інтернет-магазин одягу Є що: асортимент, якість, доставка по Україні',
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-12 pb-8">
      <nav className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Головна
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground">Про нас</span>
      </nav>

      <header className="space-y-4 border-b border-border/80 pb-10">
        <h1 className="font-display text-4xl font-normal tracking-tight text-foreground md:text-5xl">
          Про «Є що»
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Онлайн-каталог одягу та аксесуарів: зручний вибір розмірів і кольорів, прозорі ціни й доставка по
          Україні.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-normal tracking-tight text-foreground">Хто ми</h2>
        <p className="leading-relaxed text-muted-foreground">
          «Є що» — це інтернет-магазин для тих, хто хоче швидко знайти річ «саме ту» без зайвого шуму. Ми
          збираємо актуальні колекції жіночого, чоловічого та унісекс одягу, працюємо з перевіреними
          постачальниками й регулярно оновлюємо вітрину.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-normal tracking-tight text-foreground">Що ви знайдете</h2>
        <ul className="list-inside list-disc space-y-2 leading-relaxed text-muted-foreground">
          <li>Одяг на щодень і на вихід: футболки, сорочки, куртки, брюки, сукні та інше</li>
          <li>Різні розміри, зокрема моделі великих розмірів — залежно від наявності в постачальників</li>
          <li>Зручні фільтри за категоріями та зрозуміла картка товару з фото та ціною</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-normal tracking-tight text-foreground">Наші принципи</h2>
        <ul className="list-inside list-disc space-y-2 leading-relaxed text-muted-foreground">
          <li>Чесний опис і актуальні фото з каталогу</li>
          <li>Підтримка під час вибору розміру та кольору</li>
          <li>Повага до вашого часу: зрозуміле оформлення замовлення й статуси доставки</li>
        </ul>
      </section>

      <section className="rounded-xl border border-border/80 bg-muted/30 px-6 py-8">
        <h2 className="font-display text-xl font-normal tracking-tight text-foreground">Звʼяжіться з нами</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Уточнити наявність, розмір чи умови доставки можна через розділ контактів — ми на звʼязку у робочі
          години.
        </p>
        <Button asChild className="mt-6 rounded-md font-semibold">
          <Link href="/contacts">Контакти</Link>
        </Button>
      </section>

      <p className="border-t border-border/60 pt-8 text-xs text-muted-foreground">
        Текст типовий для старту магазину; замініть реквізитами, графіком і політиками під ваш бренд.
      </p>
    </article>
  );
}
