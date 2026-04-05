import { DataTable } from "@/pages/products/data-table";
import {
	catalogProductColumns,
	mapGridItemToRow,
} from "@/pages/products/catalog-columns";
import {
	fetchProductsCount,
	fetchProductsPage,
} from "@/lib/catalog-api-client";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 48;

export default function ProductsPage() {
	const [rows, setRows] = useState<ReturnType<typeof mapGridItemToRow>[]>([]);
	const [total, setTotal] = useState<number | null>(null);
	const [page, setPage] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async (pageIndex: number) => {
		setLoading(true);
		setError(null);
		try {
			const [items, count] = await Promise.all([
				fetchProductsPage(PAGE_SIZE, pageIndex * PAGE_SIZE),
				fetchProductsCount(),
			]);
			setRows(items.map(mapGridItemToRow));
			setTotal(count);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Помилка завантаження");
			setRows([]);
			setTotal(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load(page);
	}, [load, page]);

	return (
		<div className="">
			<div className="bg-secondary mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md px-4 py-2">
				<h1 className="font-semibold">Товари (catalog-api)</h1>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => void load(page)}
				>
					Оновити
				</Button>
			</div>
			<p className="text-muted-foreground mb-2 text-sm">
				GET{" "}
				<code className="rounded bg-muted px-1">
					/api/products?limit=&amp;offset=
				</code>
				{" · "}
				<code className="rounded bg-muted px-1">/api/products/count</code>
			</p>
			{total !== null ? (
				<p className="text-muted-foreground mb-4 text-sm">
					У базі (вітрина):{" "}
					<span className="text-foreground font-medium">{total}</span> позицій
					{total > PAGE_SIZE
						? ` · сторінка ${page + 1} з ${Math.ceil(total / PAGE_SIZE)}`
						: null}
				</p>
			) : null}
			{total !== null && total > PAGE_SIZE ? (
				<div className="mb-4 flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={page <= 0 || loading}
						onClick={() => setPage((p) => Math.max(0, p - 1))}
					>
						Назад
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={loading || (page + 1) * PAGE_SIZE >= total}
						onClick={() => setPage((p) => p + 1)}
					>
						Далі
					</Button>
				</div>
			) : null}
			{loading && (
				<p className="text-muted-foreground text-sm">Завантаження…</p>
			)}
			{error && (
				<p className="text-destructive mb-4 text-sm" role="alert">
					{error}
				</p>
			)}
			{!loading && rows.length > 0 ? (
				<DataTable columns={catalogProductColumns} data={rows} />
			) : null}
			{!loading && rows.length === 0 && !error ? (
				<p className="text-muted-foreground text-sm">Немає записів.</p>
			) : null}
		</div>
	);
}
