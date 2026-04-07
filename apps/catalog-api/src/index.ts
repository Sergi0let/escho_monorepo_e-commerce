import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../store/.env.local") });
/** Локальні секрети саме API (ADMIN_API_KEY тощо) — мають перекривати корінь. */
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({
	path: path.resolve(__dirname, "../.env.local"),
	override: true,
});

const app = createApp();

const port = Number(
  process.env.PORT ?? process.env.CATALOG_API_PORT ?? "4001",
);
const listenHost = process.env.CATALOG_API_HOST ?? "0.0.0.0";

app.listen(port, listenHost, () => {
  console.log(
    `catalog-api listening on http://${listenHost}:${port} (set PORT or CATALOG_API_PORT)`,
  );
});
