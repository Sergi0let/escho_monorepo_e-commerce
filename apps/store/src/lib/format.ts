export function formatUah(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export const genderLabel: Record<string, string> = {
  male: 'Чоловіче',
  female: 'Жіноче',
  unisex: 'Унісекс',
  unknown: 'Каталог',
};
