import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CatalogGridItem } from "@/lib/catalog-types";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

export type CatalogProductRow = {
	rowKey: string;
	productId: string;
	title: string;
	colorLabel: string | null;
	priceFrom: number | null;
	thumb: string | null;
	gender: string;
	productKind: string | null;
};

export function mapGridItemToRow(item: CatalogGridItem): CatalogProductRow {
	if ("product_id" in item && "color_name" in item) {
		return {
			rowKey: item.id,
			productId: item.product_id,
			title: item.title?.trim() || "Без назви",
			colorLabel: item.color_name,
			priceFrom:
				item.price_from != null && item.price_from !== ""
					? Number.parseFloat(item.price_from)
					: null,
			thumb: item.thumb,
			gender: item.gender,
			productKind: item.product_kind,
		};
	}
	return {
		rowKey: item.id,
		productId: item.id,
		title: item.title?.trim() || "Без назви",
		colorLabel: null,
		priceFrom:
			item.price_from != null && item.price_from !== ""
				? Number.parseFloat(item.price_from)
				: null,
		thumb: item.thumb,
		gender: item.gender,
		productKind: item.product_kind,
	};
}

function formatUah(n: number | null): string {
	if (n === null || !Number.isFinite(n)) return "—";
	return new Intl.NumberFormat("uk-UA", {
		style: "currency",
		currency: "UAH",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n);
}

export const catalogProductColumns: ColumnDef<CatalogProductRow>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				checked={row.getIsSelected()}
			/>
		),
	},
	{
		id: "thumb",
		header: "Фото",
		cell: ({ row }) => {
			const src = row.original.thumb;
			return src ? (
				<img
					src={src}
					alt=""
					className="h-9 w-9 rounded-md object-cover"
					referrerPolicy="no-referrer"
				/>
			) : (
				<span className="text-muted-foreground text-xs">—</span>
			);
		},
	},
	{
		accessorKey: "title",
		header: "Назва",
	},
	{
		accessorKey: "colorLabel",
		header: "Колір",
		cell: ({ row }) => row.original.colorLabel ?? "—",
	},
	{
		accessorKey: "priceFrom",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Ціна від
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => (
			<span className="tabular-nums">{formatUah(row.original.priceFrom)}</span>
		),
		sortingFn: (a, b) => {
			const pa = a.original.priceFrom ?? -1;
			const pb = b.original.priceFrom ?? -1;
			return pa - pb;
		},
	},
	{
		accessorKey: "gender",
		header: "Стать",
	},
	{
		accessorKey: "productKind",
		header: "Вид",
		cell: ({ row }) => row.original.productKind ?? "—",
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const p = row.original;
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Меню</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Дії</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() => navigator.clipboard.writeText(p.productId)}
						>
							Копіювати ID товару
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link to={`/products/${p.productId}`}>Відкрити картку</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
