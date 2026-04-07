import * as catalog from "@repo/db";
import type express from "express";
import { listByColor, parseListFilters } from "../utils/env-config.js";

export function registerCategoryRoutes(app: express.Express): void {
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
}
