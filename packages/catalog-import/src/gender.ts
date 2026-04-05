import type { CategoryRow, Gender } from './types.js';

/** Ланцюжок назв від листа до кореня */
export function getCategoryNameChain(
  categoryId: bigint,
  byId: Map<bigint, CategoryRow>,
): string[] {
  const chain: string[] = [];
  let cur: bigint | undefined = categoryId;
  const guard = new Set<bigint>();
  while (cur !== undefined && byId.has(cur) && !guard.has(cur)) {
    guard.add(cur);
    const row: CategoryRow = byId.get(cur)!;
    chain.push(row.name);
    cur = row.parentId ?? undefined;
  }
  return chain;
}

function textMatchesMale(text: string): boolean {
  const t = text.toLowerCase();
  if (t.includes('унісекс') || t.includes('унисекс')) return false;
  if (t.includes('жіноч') || t.includes('для жінок') || t.includes('дівчат')) return false;
  if (
    t.includes('чоловіч') ||
    t.includes('чоловік') ||
    t.includes('для чоловік') ||
    t.includes('мужск') ||
    t.includes('мужчин') ||
    /\bmen\b/.test(t) ||
    /\bmale\b/.test(t) ||
    /\bчол\./.test(t) ||
    /^чол[\s.,]/i.test(text.trim())
  ) {
    return true;
  }
  return false;
}

function textMatchesFemale(text: string): boolean {
  const t = text.toLowerCase();
  if (t.includes('жіноч') || t.includes('для жінок') || t.includes('дівчат')) return true;
  return false;
}

function textMatchesUnisex(text: string): boolean {
  const t = text.toLowerCase();
  return t.includes('унісекс') || t.includes('унисекс');
}

/**
 * Визначає стать за категоріями, далі за текстом офера.
 */
export function inferGender(
  categoryId: bigint,
  categories: Map<bigint, CategoryRow>,
  fallbackText: string,
): Gender {
  const chain = getCategoryNameChain(categoryId, categories);
  const combinedCat = chain.join(' ');

  if (textMatchesUnisex(combinedCat)) return 'unisex';

  let male = false;
  let female = false;
  for (const name of chain) {
    if (textMatchesUnisex(name)) return 'unisex';
    if (textMatchesFemale(name)) female = true;
    else if (textMatchesMale(name)) male = true;
  }

  if (male && female) {
    // Конфлікт — зазвичай лист ближче до початку chain; перший у ланцюгу = leaf? 
    // chain[0] = leaf category in our build - actually we push leaf first? 
    // getCategoryNameChain: starts from categoryId (leaf), pushes row.name, then parent
    // So chain[0] is leaf, chain[last] is root
    for (const name of chain) {
      if (textMatchesFemale(name) && !textMatchesUnisex(name)) return 'female';
      if (textMatchesMale(name) && !textMatchesUnisex(name)) return 'male';
    }
    return 'unknown';
  }
  if (female) return 'female';
  if (male) return 'male';

  const fb = fallbackText;
  if (textMatchesUnisex(fb)) return 'unisex';
  if (textMatchesFemale(fb)) return 'female';
  if (textMatchesMale(fb)) return 'male';

  return 'unknown';
}
