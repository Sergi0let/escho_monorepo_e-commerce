import type express from "express";
import { Router } from "express";
import { requireApiKey } from "../middleware/require-api-key.js";
import { mountAdminCategoryRoutes } from "./admin-categories.js";
import { mountAdminProductRoutes } from "./admin-products.js";

export function registerAdminRoutes(app: express.Express): void {
  const r = Router();
  r.use(requireApiKey);
  mountAdminCategoryRoutes(r);
  mountAdminProductRoutes(r);
  app.use("/api/admin", r);
}
