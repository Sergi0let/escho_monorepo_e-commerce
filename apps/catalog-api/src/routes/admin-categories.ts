import * as catalog from "@repo/db";
import type { Router } from "express";
import { sendInternalError } from "../utils/internal-error.js";

function prismaCode(e: unknown): string | undefined {
  if (typeof e === "object" && e !== null && "code" in e) {
    return String((e as { code: unknown }).code);
  }
  return undefined;
}

export function mountAdminCategoryRoutes(r: Router): void {
  r.post("/categories", async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const name = body.name;
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json({ error: "name is required" });
        return;
      }
      let id: bigint;
      try {
        const idRaw = body.id;
        if (typeof idRaw === "bigint") id = idRaw;
        else if (typeof idRaw === "number" && Number.isInteger(idRaw))
          id = BigInt(idRaw);
        else if (typeof idRaw === "string" && /^\d+$/.test(idRaw))
          id = BigInt(idRaw);
        else {
          res.status(400).json({ error: "id must be a numeric id" });
          return;
        }
      } catch {
        res.status(400).json({ error: "invalid id" });
        return;
      }

      let parentId: bigint | null | undefined;
      if ("parent_id" in body) {
        const p = body.parent_id;
        if (p === null) parentId = null;
        else if (typeof p === "string" && /^\d+$/.test(p)) parentId = BigInt(p);
        else if (typeof p === "number" && Number.isInteger(p)) parentId = BigInt(p);
        else {
          res.status(400).json({ error: "invalid parent_id" });
          return;
        }
      }

      const row = await catalog.createCategory({
        id,
        name,
        ...(parentId !== undefined ? { parentId } : {}),
      });
      res.status(201).json({
        id: row.id.toString(),
        name: row.name,
        parent_id: row.parentId?.toString() ?? null,
      });
    } catch (e) {
      const code = prismaCode(e);
      if (code === "P2002") {
        res.status(409).json({ error: "Category id already exists" });
        return;
      }
      sendInternalError(res, e, "admin/categories POST");
    }
  });

  r.patch("/categories/:id", async (req, res) => {
    try {
      if (!/^\d+$/.test(req.params.id)) {
        res.status(400).json({ error: "Invalid category id" });
        return;
      }
      const id = BigInt(req.params.id);
      const body = req.body as Record<string, unknown>;
      const patch: { name?: string; parentId?: bigint | null } = {};
      if ("name" in body) {
        if (typeof body.name !== "string" || !body.name.trim()) {
          res.status(400).json({ error: "name must be a non-empty string" });
          return;
        }
        patch.name = body.name;
      }
      if ("parent_id" in body) {
        const p = body.parent_id;
        if (p === null) patch.parentId = null;
        else if (typeof p === "string" && /^\d+$/.test(p))
          patch.parentId = BigInt(p);
        else if (typeof p === "number" && Number.isInteger(p))
          patch.parentId = BigInt(p);
        else {
          res.status(400).json({ error: "invalid parent_id" });
          return;
        }
      }
      if (Object.keys(patch).length === 0) {
        res.status(400).json({ error: "No fields to update" });
        return;
      }
      const row = await catalog.updateCategory(id, patch);
      res.json({
        id: row.id.toString(),
        name: row.name,
        parent_id: row.parentId?.toString() ?? null,
      });
    } catch (e) {
      if (prismaCode(e) === "P2025") {
        res.status(404).json({ error: "Not found" });
        return;
      }
      sendInternalError(res, e, "admin/categories PATCH");
    }
  });
}
