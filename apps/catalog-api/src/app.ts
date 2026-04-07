import cors from "cors";
import express from "express";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerCategoryRoutes } from "./routes/categories.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerOrderRoutes } from "./routes/orders.js";
import { registerProductRoutes } from "./routes/products.js";

export function createApp(): express.Express {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());

  registerHealthRoutes(app);
  registerOrderRoutes(app);
  registerCategoryRoutes(app);
  registerProductRoutes(app);
  registerAdminRoutes(app);

  return app;
}
