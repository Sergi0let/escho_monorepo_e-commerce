import { DataTable } from "@/pages/products/data-table";
import { categoryColumns } from "@/pages/categories/columns";
import { fetchNavCategories } from "@/lib/catalog-api-client";
import type { CategoryRow } from "@/lib/catalog-types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function CategoriesPage() {
	const [data, setData] = useState<CategoryRow[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const load = () => {
		setLoading(true);
		setError(null);
		fetchNavCategories(200)
			.then(setData)
			.catch((e: unknown) => {
				setError(e instanceof Error ? e.message : "Помилка завантаження");
				setData(null);
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		load();
	}, []);

	return (
		<div className="">
			<div className="bg-secondary mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md px-4 py-2">
				<h1 className="font-semibold">Категорії (catalog-api)</h1>
				<Button type="button" variant="outline" size="sm" onClick={load}>
					Оновити
				</Button>
			</div>
			<p className="text-muted-foreground mb-4 text-sm">
				GET <code className="rounded bg-muted px-1">/api/categories/nav</code>
			</p>
			{loading && <p className="text-muted-foreground text-sm">Завантаження…</p>}
			{error && (
				<p className="text-destructive mb-4 text-sm" role="alert">
					{error}
				</p>
			)}
			{data && !loading ? (
				<DataTable columns={categoryColumns} data={data} />
			) : null}
		</div>
	);
}
