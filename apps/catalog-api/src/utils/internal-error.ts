import type { Response } from "express";

function exposeErrorDetail(): boolean {
  const v = process.env.CATALOG_API_VERBOSE_ERRORS?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function extractErrInfo(err: unknown): { code?: string; message?: string } {
  if (typeof err !== "object" || err === null) {
    return { message: String(err) };
  }
  const o = err as Record<string, unknown>;
  return {
    code: typeof o.code === "string" ? o.code : undefined,
    message: typeof o.message === "string" ? o.message : undefined,
  };
}

/** Лог у stderr + 500; за `CATALOG_API_VERBOSE_ERRORS=1` додає `detail`/`code` у JSON (тимчасово для дебагу). */
export function sendInternalError(
  res: Response,
  err: unknown,
  context?: string,
): void {
  const tag = context ? `[catalog-api:${context}]` : "[catalog-api]";
  console.error(tag, err);
  const body: Record<string, unknown> = { error: "Internal error" };
  if (exposeErrorDetail()) {
    const { code, message } = extractErrInfo(err);
    if (message) body.detail = message;
    if (code) body.code = code;
  }
  res.status(500).json(body);
}
