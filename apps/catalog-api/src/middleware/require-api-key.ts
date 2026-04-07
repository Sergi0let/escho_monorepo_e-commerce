import type { RequestHandler } from "express";

/** Захист мутацій під `/api/admin/*`. Публічні GET та POST /api/orders без ключа. */
export const requireApiKey: RequestHandler = (req, res, next) => {
  const expected = process.env.ADMIN_API_KEY?.trim();
  if (!expected) {
    res.status(401).json({ error: "Admin API key not configured" });
    return;
  }
  const sent = req.get("x-api-key")?.trim();
  if (!sent || sent !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};
