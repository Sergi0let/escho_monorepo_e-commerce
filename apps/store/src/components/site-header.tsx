import { HeaderNav } from '@/components/header-nav';
import { getStorefrontNavCategories } from '@/lib/queries';

/** Серверний хедер: підрозділи (діти root) для випадаючого меню. */
export async function SiteHeader() {
  let categories: Awaited<ReturnType<typeof getStorefrontNavCategories>> = [];
  try {
    categories = await getStorefrontNavCategories(80);
  } catch {
    /* catalog-api недоступний (наприклад, під час збірки без CATALOG_API_URL) */
  }
  return <HeaderNav categories={categories} />;
}
