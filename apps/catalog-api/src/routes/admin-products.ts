import * as catalog from "@repo/db";
import type { Gender } from "@repo/db";
import type { Router } from "express";
import { sendInternalError } from "../utils/internal-error.js";

const GENDERS = new Set<string>(["male", "female", "unisex", "unknown"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function prismaCode(e: unknown): string | undefined {
  if (typeof e === "object" && e !== null && "code" in e) {
    return String((e as { code: unknown }).code);
  }
  return undefined;
}

function toSkuJsonRow(s: {
  barcode: string;
  sizeLabel: string | null;
  price: unknown;
  oldPrice: unknown;
  available: boolean;
}) {
  return {
    barcode: s.barcode,
    size_label: s.sizeLabel ?? null,
    price: String(s.price),
    old_price: String(s.oldPrice),
    available: Boolean(s.available),
  };
}

function parseStringOrNull(
  v: unknown,
  field: string,
): { ok: false; error: string } | { ok: true; val: string | null } {
  if (v === null) return { ok: true, val: null };
  if (typeof v === "string") return { ok: true, val: v };
  return { ok: false, error: `Invalid ${field}` };
}

function parseProductWriteBody(
  body: Record<string, unknown>,
): { ok: true; data: catalog.ProductCreatePayload } | { ok: false; error: string } {
  const data: catalog.ProductCreatePayload = {};

  if ("title" in body) {
    const r = parseStringOrNull(body.title, "title");
    if (!r.ok) return r;
    data.title = r.val;
  }
  if ("description" in body) {
    const r = parseStringOrNull(body.description, "description");
    if (!r.ok) return r;
    data.description = r.val;
  }
  if ("brand" in body) {
    const r = parseStringOrNull(body.brand, "brand");
    if (!r.ok) return r;
    data.brand = r.val;
  }
  if ("fabric" in body) {
    const r = parseStringOrNull(body.fabric, "fabric");
    if (!r.ok) return r;
    data.fabric = r.val;
  }
  if ("country" in body) {
    const r = parseStringOrNull(body.country, "country");
    if (!r.ok) return r;
    data.country = r.val;
  }
  if ("product_kind" in body) {
    const r = parseStringOrNull(body.product_kind, "product_kind");
    if (!r.ok) return r;
    data.productKind = r.val;
  }
  if ("feed_shop_name" in body) {
    const r = parseStringOrNull(body.feed_shop_name, "feed_shop_name");
    if (!r.ok) return r;
    data.feedShopName = r.val;
  }
  if ("category_id" in body) {
    const v = body.category_id;
    if (v === null) data.categoryId = null;
    else if (typeof v === "string" && /^\d+$/.test(v)) data.categoryId = BigInt(v);
    else if (typeof v === "number" && Number.isInteger(v) && v >= 0)
      data.categoryId = BigInt(v);
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
    data.gender = g as Gender;
  }

  return { ok: true, data };
}

function parseProductPatch(body: Record<string, unknown>): {
  ok: true;
  patch: catalog.ProductUpdatePayload;
} | { ok: false; error: string } {
  const patch: catalog.ProductUpdatePayload = {};

  if ("title" in body) {
    const r = parseStringOrNull(body.title, "title");
    if (!r.ok) return r;
    patch.title = r.val;
  }
  if ("description" in body) {
    const r = parseStringOrNull(body.description, "description");
    if (!r.ok) return r;
    patch.description = r.val;
  }
  if ("brand" in body) {
    const r = parseStringOrNull(body.brand, "brand");
    if (!r.ok) return r;
    patch.brand = r.val;
  }
  if ("fabric" in body) {
    const r = parseStringOrNull(body.fabric, "fabric");
    if (!r.ok) return r;
    patch.fabric = r.val;
  }
  if ("country" in body) {
    const r = parseStringOrNull(body.country, "country");
    if (!r.ok) return r;
    patch.country = r.val;
  }
  if ("product_kind" in body) {
    const r = parseStringOrNull(body.product_kind, "product_kind");
    if (!r.ok) return r;
    patch.productKind = r.val;
  }
  if ("feed_shop_name" in body) {
    const r = parseStringOrNull(body.feed_shop_name, "feed_shop_name");
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
  r.post("/products", async (req, res) => {
    try {
      const body = req.body;
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        res.status(400).json({ error: "Body must be a JSON object" });
        return;
      }
      const parsed = parseProductWriteBody(body as Record<string, unknown>);
      if (!parsed.ok) {
        res.status(400).json({ error: parsed.error });
        return;
      }

      const created = await catalog.createProduct(parsed.data);
      const row = await catalog.getProductById(created.id);
      if (!row) {
        res.status(500).json({ error: "Failed to load created product" });
        return;
      }
      res.status(201).json(row);
    } catch (e) {
      if (prismaCode(e) === "P2002") {
        res.status(409).json({ error: "Conflict" });
        return;
      }
      sendInternalError(res, e, "admin/products POST");
    }
  });

  r.post("/products/:id/colors", async (req, res) => {
    try {
      const id = req.params.id;
      if (!UUID_RE.test(id)) {
        res.status(400).json({ error: "Invalid product id" });
        return;
      }
      const body = req.body;
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        res.status(400).json({ error: "Body must be a JSON object" });
        return;
      }
      const b = body as Record<string, unknown>;
      const colorName =
        typeof b.color_name === "string" ? b.color_name.trim() : "";
      if (!colorName) {
        res.status(400).json({ error: "color_name is required" });
        return;
      }
      const sortOrder =
        b.sort_order === undefined
          ? undefined
          : typeof b.sort_order === "number" && Number.isInteger(b.sort_order)
            ? b.sort_order
            : undefined;
      if (b.sort_order !== undefined && sortOrder === undefined) {
        res.status(400).json({ error: "sort_order must be an integer" });
        return;
      }
      const imageUrls =
        b.image_urls === undefined
          ? undefined
          : Array.isArray(b.image_urls) && b.image_urls.every((x) => typeof x === "string")
            ? (b.image_urls as string[])
            : null;
      if (b.image_urls !== undefined && imageUrls === null) {
        res.status(400).json({ error: "image_urls must be an array of strings" });
        return;
      }

      await catalog.createProductColor(id, {
        colorName,
        sortOrder,
        imageUrls: imageUrls ?? undefined,
      });

      const colors = await catalog.getProductColorsWithSkus(id);
      res.status(201).json(colors);
    } catch (e) {
      if (prismaCode(e) === "P2002") {
        res.status(409).json({ error: "Conflict" });
        return;
      }
      if (prismaCode(e) === "P2025") {
        res.status(404).json({ error: "Not found" });
        return;
      }
      sendInternalError(res, e, "admin/products/:id/colors POST");
    }
  });

  r.post("/products/:id/skus", async (req, res) => {
    try {
      const id = req.params.id;
      if (!UUID_RE.test(id)) {
        res.status(400).json({ error: "Invalid product id" });
        return;
      }
      const body = req.body;
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        res.status(400).json({ error: "Body must be a JSON object" });
        return;
      }
      const b = body as Record<string, unknown>;
      const productColorId =
        typeof b.product_color_id === "string" ? b.product_color_id.trim() : "";
      if (!UUID_RE.test(productColorId)) {
        res.status(400).json({ error: "Invalid product_color_id" });
        return;
      }
      const barcode = typeof b.barcode === "string" ? b.barcode.trim() : "";
      if (!barcode) {
        res.status(400).json({ error: "barcode is required" });
        return;
      }

      const sizeLabel =
        b.size_label === undefined
          ? undefined
          : b.size_label === null
            ? null
            : typeof b.size_label === "string"
              ? b.size_label
              : undefined;
      if (b.size_label !== undefined && sizeLabel === undefined) {
        res.status(400).json({ error: "size_label must be a string or null" });
        return;
      }

      const price = b.price;
      if (
        !(
          (typeof price === "number" && Number.isFinite(price)) ||
          (typeof price === "string" && price.trim() !== "")
        )
      ) {
        res.status(400).json({ error: "price is required" });
        return;
      }
      const oldPriceRaw = b.old_price;
      const oldPrice =
        oldPriceRaw === undefined
          ? price
          : typeof oldPriceRaw === "number" && Number.isFinite(oldPriceRaw)
            ? oldPriceRaw
            : typeof oldPriceRaw === "string"
              ? oldPriceRaw.trim() === ""
                ? price
                : oldPriceRaw
              : null;
      if (oldPrice === null) {
        res.status(400).json({ error: "Invalid old_price" });
        return;
      }

      const available =
        b.available === undefined
          ? undefined
          : typeof b.available === "boolean"
            ? b.available
            : undefined;
      if (b.available !== undefined && available === undefined) {
        res.status(400).json({ error: "available must be boolean" });
        return;
      }

      const created = await catalog.createSku(id, {
        productColorId,
        barcode,
        sizeLabel: sizeLabel ?? undefined,
        price,
        oldPrice,
        available,
      });

      res.status(201).json(
        toSkuJsonRow({
          barcode: created.barcode,
          sizeLabel: created.sizeLabel,
          price: created.price,
          oldPrice: created.oldPrice,
          available: created.available,
        }),
      );
    } catch (e) {
      if (prismaCode(e) === "P2002") {
        res.status(409).json({ error: "Conflict" });
        return;
      }
      if (prismaCode(e) === "P2025") {
        res.status(404).json({ error: "Not found" });
        return;
      }
      sendInternalError(res, e, "admin/products/:id/skus POST");
    }
  });

  r.patch("/skus/:barcode", async (req, res) => {
    try {
      const barcodeRaw = req.params.barcode;
      const barcode = typeof barcodeRaw === "string" ? barcodeRaw.trim() : "";
      if (!barcode) {
        res.status(400).json({ error: "Invalid barcode" });
        return;
      }
      const body = req.body;
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        res.status(400).json({ error: "Body must be a JSON object" });
        return;
      }
      const b = body as Record<string, unknown>;

      const patch: catalog.SkuUpdatePayload = {};
      if ("size_label" in b) {
        if (b.size_label === null) patch.sizeLabel = null;
        else if (typeof b.size_label === "string") patch.sizeLabel = b.size_label;
        else {
          res.status(400).json({ error: "size_label must be string or null" });
          return;
        }
      }
      if ("price" in b) {
        if (
          (typeof b.price === "number" && Number.isFinite(b.price)) ||
          (typeof b.price === "string" && b.price.trim() !== "")
        )
          patch.price = b.price as string | number;
        else {
          res.status(400).json({ error: "Invalid price" });
          return;
        }
      }
      if ("old_price" in b) {
        if (typeof b.old_price === "number" && Number.isFinite(b.old_price)) {
          patch.oldPrice = b.old_price;
        } else if (typeof b.old_price === "string") {
          if (b.old_price.trim() === "") {
            // default old_price = price (either the incoming patch.price or current DB price)
            if (patch.price !== undefined) {
              patch.oldPrice = patch.price;
            } else {
              const current = await catalog.getSkuByBarcode(barcode);
              if (!current) {
                res.status(404).json({ error: "Not found" });
                return;
              }
              patch.oldPrice = current.price.toString();
            }
          } else {
            patch.oldPrice = b.old_price;
          }
        } else {
          res.status(400).json({ error: "Invalid old_price" });
          return;
        }
      }
      if ("available" in b) {
        if (typeof b.available === "boolean") patch.available = b.available;
        else {
          res.status(400).json({ error: "available must be boolean" });
          return;
        }
      }
      if (Object.keys(patch).length === 0) {
        res.status(400).json({ error: "No valid fields to update" });
        return;
      }

      const updated = await catalog.updateSkuByBarcode(barcode, patch);
      res.json(
        toSkuJsonRow({
          barcode: updated.barcode,
          sizeLabel: updated.sizeLabel,
          price: updated.price,
          oldPrice: updated.oldPrice,
          available: updated.available,
        }),
      );
    } catch (e) {
      if (prismaCode(e) === "P2025") {
        res.status(404).json({ error: "Not found" });
        return;
      }
      sendInternalError(res, e, "admin/skus PATCH");
    }
  });

  r.delete("/skus/:barcode", async (req, res) => {
    try {
      const barcodeRaw = req.params.barcode;
      const barcode = typeof barcodeRaw === "string" ? barcodeRaw.trim() : "";
      if (!barcode) {
        res.status(400).json({ error: "Invalid barcode" });
        return;
      }
      await catalog.deleteSkuByBarcode(barcode);
      res.status(204).end();
    } catch (e) {
      if (prismaCode(e) === "P2025") {
        res.status(404).json({ error: "Not found" });
        return;
      }
      sendInternalError(res, e, "admin/skus DELETE");
    }
  });

  r.delete("/products/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!UUID_RE.test(id)) {
        res.status(400).json({ error: "Invalid product id" });
        return;
      }
      await catalog.deleteProduct(id);
      res.status(204).end();
    } catch (e) {
      if (prismaCode(e) === "P2025") {
        res.status(404).json({ error: "Not found" });
        return;
      }
      sendInternalError(res, e, "admin/products DELETE");
    }
  });

  r.delete("/product-colors/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!UUID_RE.test(id)) {
        res.status(400).json({ error: "Invalid product_color id" });
        return;
      }
      await catalog.deleteProductColor(id);
      res.status(204).end();
    } catch (e) {
      if (prismaCode(e) === "P2025") {
        res.status(404).json({ error: "Not found" });
        return;
      }
      sendInternalError(res, e, "admin/product-colors DELETE");
    }
  });

  r.patch("/products/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!UUID_RE.test(id)) {
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
