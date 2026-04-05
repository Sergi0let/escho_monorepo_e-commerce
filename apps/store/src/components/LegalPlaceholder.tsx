import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  lead: string;
  children?: ReactNode;
};

export function LegalPlaceholder({ title, lead, children }: Props) {
  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <nav className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Головна
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground">{title}</span>
      </nav>
      <header className="space-y-3 border-b border-border/80 pb-8">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">{lead}</p>
      </header>
      <div className="space-y-4 rounded-lg border border-dashed border-border/80 bg-muted/20 p-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Тут буде повний текст розділу. Зараз це демо-заглушка для типової інтернет-крамниці — замініть
          вміст на юридично затверджений після запуску.
        </p>
        {children}
      </div>
    </article>
  );
}
