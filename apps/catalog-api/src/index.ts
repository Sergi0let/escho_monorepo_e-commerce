import path from "node:path";
import { fileURLToPath } from "node:url";
import * as catalog from "@repo/db";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import {
  getTelegramConfig,
  sendOrderToTelegram,
  type OrderBody,
} from "./order-telegram.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../store/.env.local") });

const app = express();
const port = Number(process.env.CATALOG_API_PORT ?? "4001");

/** Картка вітрини: `product` (за замовчуванням) або `color` — окремий рядок на кожен колір. */
function listByColor(): boolean {
  return process.env.CATALOG_CARD_GRANULARITY === "color";
}

function parsePriceQuery(v: unknown): number | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n);
}

function parseListFilters(req: express.Request): catalog.CatalogListFilters {
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

app.use(cors({ origin: true }));
app.use(express.json());

app.post("/api/orders", async (req, res) => {
  try {
    const data = req.body as OrderBody;

    const requiredFields = [
      "lastname",
      "name",
      "phone",
      "deliveryType",
      "deliveryAddress",
      "paymentType",
    ] as const;

    if (requiredFields.some((field) => !data[field]?.toString().trim())) {
      res.status(400).json({ message: "Заповніть усі обов’язкові поля" });
      return;
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      res.status(400).json({
        message: "Кошик порожній або дані товарів не передані",
      });
      return;
    }

    const totalPrice =
      typeof data.totalPrice === "number" && Number.isFinite(data.totalPrice)
        ? data.totalPrice
        : data.items.reduce((s, i) => s + i.price * i.quantity, 0);

    const payload = {
      name: data.name!.trim(),
      lastname: data.lastname!.trim(),
      phone: data.phone!.trim(),
      mail: (data.mail ?? "").trim(),
      deliveryType: data.deliveryType!.trim(),
      deliveryCity: data.deliveryCity?.trim(),
      deliveryAddress: data.deliveryAddress!.trim(),
      paymentType: data.paymentType!.trim(),
      comment: data.comment?.trim() ?? "",
      items: data.items,
      totalPrice,
    };

    const { botToken, chatIds } = getTelegramConfig();

    if (!botToken || chatIds.length === 0) {
      console.warn(
        "[orders] Telegram не налаштовано (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)",
      );
      res.status(200).json({
        message:
          "Замовлення прийнято локально (demo: не задано Telegram у .env)",
        demo: true,
      });
      return;
    }

    await sendOrderToTelegram(botToken, chatIds, payload);

    res.status(200).json({ message: "Замовлення відправлено в Telegram" });
  } catch (error) {
    console.error("[orders] Telegram:", error);
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Помилка під час відправки в Telegram",
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/categories/nav", async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 80));
    const data = await catalog.getStorefrontNavCategories(limit);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/categories/:id", async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      res.status(400).json({ error: "Invalid category id" });
      return;
    }
    const id = BigInt(req.params.id);
    const row = await catalog.getCategoryById(id);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/categories/:id/products/count", async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      res.status(400).json({ error: "Invalid category id" });
      return;
    }
    const id = BigInt(req.params.id);
    const filters = parseListFilters(req);
    const count = listByColor()
      ? await catalog.countColorCardsByCategory(id, filters)
      : await catalog.countProductsByCategory(id, filters);
    res.json({ count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/categories/:id/products", async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      res.status(400).json({ error: "Invalid category id" });
      return;
    }
    const id = BigInt(req.params.id);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 48));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const filters = parseListFilters(req);
    const data = listByColor()
      ? await catalog.getColorCardsByCategory(id, limit, offset, filters)
      : await catalog.getProductsByCategory(id, limit, offset, filters);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/products/count", async (req, res) => {
  try {
    const filters = parseListFilters(req);
    const count = listByColor()
      ? await catalog.countColorCards(filters)
      : await catalog.countStockedProducts(filters);
    res.json({ count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 48));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const filters = parseListFilters(req);
    const data = listByColor()
      ? await catalog.getColorCardsPage(limit, offset, filters)
      : await catalog.getStockedProductsPage(limit, offset, filters);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/catalog/filter-options", async (req, res) => {
  try {
    const raw = req.query.categoryId;
    const categoryId =
      typeof raw === "string" && /^\d+$/.test(raw) ? BigInt(raw) : null;
    const data = await catalog.getCatalogFilterOptions(
      categoryId,
      listByColor(),
    );
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/products/featured/balanced", async (req, res) => {
  try {
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
    const data = await catalog.getFeaturedProductsBalanced(limit);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/products/detail/:id", async (req, res) => {
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
    const row = await catalog.getProductById(id);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/products/:id/colors", async (req, res) => {
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
    const data = await catalog.getProductColorsWithSkus(id);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

app.listen(port, () => {
  console.log(`catalog-api http://127.0.0.1:${port}`);
});
