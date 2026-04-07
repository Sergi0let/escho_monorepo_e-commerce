/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_CATALOG_API_URL?: string;
	/** Той самий рядок, що ADMIN_API_KEY на сервері catalog-api (для X-API-Key на /api/admin/*). */
	readonly VITE_CATALOG_ADMIN_API_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
