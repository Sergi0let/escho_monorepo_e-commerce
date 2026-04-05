import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CategoryRow } from "@/lib/catalog-types";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

export const categoryColumns: ColumnDef<CategoryRow>[] = [
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
		accessorKey: "id",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				ID
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => (
			<span className="font-mono text-xs">{row.getValue("id")}</span>
		),
	},
	{
		accessorKey: "name",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Назва
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
	},
	{
		accessorKey: "parent_id",
		header: "Батьківська категорія",
		cell: ({ row }) => row.original.parent_id ?? "—",
	},
];
