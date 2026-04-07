import { prisma } from "@repo/db";
import type express from "express";

function verboseErrors(): boolean {
  const v = process.env.CATALOG_API_VERBOSE_ERRORS?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function registerHealthRoutes(app: express.Express): void {
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  /** Перевірка з’єднання з Postgres (для Easypanel / діагностики 500). */
  app.get("/api/health/ready", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, database: "up" });
    } catch (e) {
      console.error("[catalog-api:health/ready]", e);
      const body: Record<string, unknown> = {
        ok: false,
        database: "down",
        error: "database_unreachable",
      };
      if (verboseErrors()) {
        body.detail = e instanceof Error ? e.message : String(e);
      }
      res.status(503).json(body);
    }
  });
}
