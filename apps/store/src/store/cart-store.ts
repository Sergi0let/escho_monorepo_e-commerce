'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartLine = {
  /** Унікальний ключ рядка в кошику */
  lineId: string;
  barcode: string;
  productId: string;
  title: string;
  colorName: string;
  sizeLabel: string | null;
  price: number;
  oldPrice: number;
  image: string | null;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, 'lineId' | 'qty'> & { qty?: number }) => void;
  setQty: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
};

function makeLineId(barcode: string) {
  return `${barcode}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addLine: (line) => {
        const qty = line.qty ?? 1;
        const lineId = makeLineId(line.barcode);
        const existing = get().lines.find((l) => l.lineId === lineId);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.lineId === lineId ? { ...l, qty: l.qty + qty } : l,
            ),
          });
          return;
        }
        set({
          lines: [
            ...get().lines,
            {
              lineId,
              barcode: line.barcode,
              productId: line.productId,
              title: line.title,
              colorName: line.colorName,
              sizeLabel: line.sizeLabel,
              price: line.price,
              oldPrice: line.oldPrice,
              image: line.image,
              qty,
            },
          ],
        });
      },
      setQty: (lineId, qty) => {
        if (qty < 1) {
          set({ lines: get().lines.filter((l) => l.lineId !== lineId) });
          return;
        }
        set({
          lines: get().lines.map((l) => (l.lineId === lineId ? { ...l, qty } : l)),
        });
      },
      removeLine: (lineId) => set({ lines: get().lines.filter((l) => l.lineId !== lineId) }),
      clear: () => set({ lines: [] }),
    }),
    { name: 'catalog-boutique-cart' },
  ),
);

export function useCartTotals() {
  const lines = useCartStore((s) => s.lines);
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  return { count, subtotal, lines };
}
