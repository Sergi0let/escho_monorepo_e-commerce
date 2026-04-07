import * as catalog from "@repo/db";
import type { Gender } from "@repo/db";
import type { Router } from "express";
import { sendInternalError } from "../utils/internal-error.js";

const GENDERS = new Set<string>(["male", "female", "unisex", "unknown"]);

function prismaCode(e: unknown): string | undefined {
  if (typeof e === "object" && e !== null && "code" in e) {
    return String((e as { code: unknown }).code);
  }
  return undefined;
}

function parseProductPatch(body: Record<string, unknown>): {
  ok: true;
  patch: catalog.ProductUpdatePayload;
} | { ok: false; error: string } {
  const patch: catalog.ProductUpdatePayload = {};
  const stringOrNull = (
    v: unknown,
    field: string,
  ): { ok: false; error: string } | { ok: true; val: string | null } => {
    if (v === null) return { ok: true, val: null };
    if (typeof v === "string") return { ok: true, val: v };
    return { ok: false, error: `Invalid ${field}` };
  };

  if ("title" in body) {
    const r = stringOrNull(body.title, "title");
    if (!r.ok) return r;
    patch.title = r.val;
  }
  if ("description" in body) {
    const r = stringOrNull(body.description, "description");
    if (!r.ok) return r;
    patch.description = r.val;
  }
  if ("brand" in body) {
    const r = stringOrNull(body.brand, "brand");
    if (!r.ok) return r;
    patch.brand = r.val;
  }
  if ("fabric" in body) {
    const r = stringOrNull(body.fabric, "fabric");
    if (!r.ok) return r;
    patch.fabric = r.val;
  }
  if ("country" in body) {
    const r = stringOrNull(body.country, "country");
    if (!r.ok) return r;
    patch.country = r.val;
  }
  if ("product_kind" in body) {
    const r = stringOrNull(body.product_kind, "product_kind");
    if (!r.ok) return r;
    patch.productKind = r.val;
  }
  if ("feed_shop_name" in body) {
    const r = stringOrNull(body.feed_shop_name, "feed_shop_name");
    if (!r.ok) return r;
    patch.feedShopName = r.val;
  }
  if ("category_id" in body) {
    const v = body.category_id;
    if (v === null) patch.categoryId = null;
    else if (typeof v === "string" && /^\d+$/.test(v))
      patch.categoryId = BigInt(v);
    else if (typeof v === "number" && Number.isInteger(v) && v >= 0)
      patch.categoryId = BigInt(v);
    else return { ok: false, error: "invalid category_id" };
  }
  if ("gender" in body) {
    const g =
      typeof body.gender === "string" ? body.gender.trim().toLowerCase() : "";
    if (!GENDERS.has(g))
      return {
        ok: false,
        error: "gender must be male | female | unisex | unknown",
      };
    patch.gender = g as Gender;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No valid fields to update" };
  }
  return { ok: true, patch };
}

export function mountAdminProductRoutes(r: Router): void {
  r.patch("/products/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id,
        )
      ) {
        res.status(400).json({ error: "Invalid product id" });
        return;
      }
      const body = req.body;
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        res.status(400).json({ error: "Body must be a JSON object" });
        return;
      }
      const parsed = parseProductPatch(body as Record<string, unknown>);
      if (!parsed.ok) {
        res.status(400).json({ error: parsed.error });
        return;
      }
      await catalog.updateProduct(id, parsed.patch);
      const row = await catalog.getProductById(id);
      if (!row) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json(row);
    } catch (e) {
      if (prismaCode(e) === "P2025") {
        res.status(404).json({ error: "Not found" });
        return;
      }
      sendInternalError(res, e, "admin/products PATCH");
    }
  });
}
