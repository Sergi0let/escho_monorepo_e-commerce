import type * as catalog from "@repo/db";
import type express from "express";

/** Картка вітрини: `product` або `color` — окремий рядок на кожен колір. */
export function listByColor(): boolean {
  return process.env.CATALOG_CARD_GRANULARITY === "color";
}

export function parsePriceQuery(v: unknown): number | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n);
}

export function parseListFilters(
  req: express.Request,
): catalog.CatalogListFilters {
  const c = req.query.color;
  const s = req.query.size;
  const priceMin = parsePriceQuery(req.query.price_min);
  const priceMax = parsePriceQuery(req.query.price_max);
  return {
    color: typeof c === "string" ? c : undefined,
    size: typeof s === "string" ? s : undefined,
    ...(priceMin !== undefined ? { priceMin } : {}),
    ...(priceMax !== undefined ? { priceMax } : {}),
  };
}
