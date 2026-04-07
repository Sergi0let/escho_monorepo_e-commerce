import { DataTable } from "@/pages/products/data-table";
import { getCategoryColumns } from "@/pages/categories/columns";
import {
	createAdminCategory,
	fetchNavCategories,
	updateAdminCategory,
} from "@/lib/catalog-api-client";
import type { CategoryRow } from "@/lib/catalog-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetFooter,
} from "@/components/ui/sheet";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const NONE_PARENT = "__none";

function formatMutationError(e: unknown): string {
	const msg = e instanceof Error ? e.message : "Невідома помилка";
	if (msg.includes("401")) {
		return `${msg} Задайте VITE_CATALOG_ADMIN_API_KEY (як ADMIN_API_KEY на catalog-api).`;
	}
	return msg;
}

export default function CategoriesPage() {
	const [data, setData] = useState<CategoryRow[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const [sheetOpen, setSheetOpen] = useState(false);
	const [mode, setMode] = useState<"create" | "edit">("create");
	const [editRow, setEditRow] = useState<CategoryRow | null>(null);

	const [createId, setCreateId] = useState("");
	const [formName, setFormName] = useState("");
	const [formParentId, setFormParentId] = useState<string>(NONE_PARENT);
	const [formSubmitting, setFormSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const load = useCallback(() => {
		setLoading(true);
		setError(null);
		fetchNavCategories(200)
			.then(setData)
			.catch((e: unknown) => {
				setError(e instanceof Error ? e.message : "Помилка завантаження");
				setData(null);
			})
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const openCreate = () => {
		setMode("create");
		setEditRow(null);
		setCreateId("");
		setFormName("");
		setFormParentId(NONE_PARENT);
		setFormError(null);
		setSheetOpen(true);
	};

	const openEdit = useCallback((row: CategoryRow) => {
		setMode("edit");
		setEditRow(row);
		setFormName(row.name);
		setFormParentId(row.parent_id ?? NONE_PARENT);
		setFormError(null);
		setSheetOpen(true);
	}, []);

	const columns = useMemo(
		() => getCategoryColumns({ onEdit: openEdit }),
		[openEdit],
	);

	const parentOptions = useMemo(() => {
		if (!data) return [];
		return [...data].sort((a, b) => a.name.localeCompare(b.name, "uk"));
	}, [data]);

	const parentSelectOptions = useMemo(() => {
		if (mode === "edit" && editRow) {
			return parentOptions.filter((c) => c.id !== editRow.id);
		}
		return parentOptions;
	}, [parentOptions, mode, editRow]);

	const submitCreate = async () => {
		setFormError(null);
		const idStr = createId.trim();
		if (!/^\d+$/.test(idStr)) {
			setFormError("ID має бути додатним числом.");
			return;
		}
		const name = formName.trim();
		if (!name) {
			setFormError("Назва обовʼязкова.");
			return;
		}
		setFormSubmitting(true);
		try {
			await createAdminCategory({
				id: idStr,
				name,
				...(formParentId !== NONE_PARENT
					? { parent_id: formParentId }
					: {}),
			});
			setSheetOpen(false);
			load();
		} catch (e: unknown) {
			setFormError(formatMutationError(e));
		} finally {
			setFormSubmitting(false);
		}
	};

	const submitEdit = async () => {
		if (!editRow) return;
		setFormError(null);
		const name = formName.trim();
		if (!name) {
			setFormError("Назва не може бути порожньою.");
			return;
		}
		setFormSubmitting(true);
		try {
			await updateAdminCategory(editRow.id, {
				name,
				parent_id:
					formParentId === NONE_PARENT ? null : formParentId,
			});
			setSheetOpen(false);
			load();
		} catch (e: unknown) {
			setFormError(formatMutationError(e));
		} finally {
			setFormSubmitting(false);
		}
	};

	return (
		<div className="">
			<div className="bg-secondary mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md px-4 py-2">
				<h1 className="font-semibold">Категорії (catalog-api)</h1>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="default"
						size="sm"
						className="cursor-pointer"
						onClick={openCreate}
					>
						Додати категорію
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="cursor-pointer"
						onClick={load}
					>
						Оновити
					</Button>
				</div>
			</div>
			<p className="text-muted-foreground mb-4 text-sm">
				GET{" "}
				<code className="rounded bg-muted px-1">/api/categories/nav</code>
				{" · "}
				POST/PATCH{" "}
				<code className="rounded bg-muted px-1">/api/admin/categories</code>
			</p>
			{loading && (
				<p className="text-muted-foreground text-sm">Завантаження…</p>
			)}
			{error && (
				<p className="text-destructive mb-4 text-sm" role="alert">
					{error}
				</p>
			)}
			{data && !loading ? (
				<DataTable columns={columns} data={data} />
			) : null}

			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent className="flex w-full max-w-md flex-col gap-4 sm:max-w-md">
					<SheetHeader>
						<SheetTitle>
							{mode === "create"
								? "Нова категорія"
								: `Редагування #${editRow?.id ?? ""}`}
						</SheetTitle>
					</SheetHeader>
					{formError ? (
						<p className="text-destructive text-sm" role="alert">
							{formError}
						</p>
					) : null}
					<div className="flex flex-col gap-4">
						{mode === "create" ? (
							<div className="space-y-2">
								<Label htmlFor="cat-new-id">Числовий ID</Label>
								<Input
									id="cat-new-id"
									inputMode="numeric"
									placeholder="напр. 5807"
									value={createId}
									onChange={(e) => setCreateId(e.target.value)}
								/>
							</div>
						) : null}
						<div className="space-y-2">
							<Label htmlFor="cat-name">Назва</Label>
							<Input
								id="cat-name"
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Батьківська категорія</Label>
							<Select
								value={formParentId}
								onValueChange={setFormParentId}
							>
								<SelectTrigger className="w-full cursor-pointer">
									<SelectValue placeholder="Без батька" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem
										value={NONE_PARENT}
										className="cursor-pointer"
									>
										Немає (корінь)
									</SelectItem>
									{parentSelectOptions.map((c) => (
										<SelectItem
											key={c.id}
											value={c.id}
											className="cursor-pointer"
										>
											{c.name}{" "}
											<span className="text-muted-foreground font-mono text-xs">
												({c.id})
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<SheetFooter className="mt-auto flex-row gap-2 sm:justify-end">
						<Button
							type="button"
							variant="outline"
							className="cursor-pointer"
							onClick={() => setSheetOpen(false)}
							disabled={formSubmitting}
						>
							Скасувати
						</Button>
						<Button
							type="button"
							className="cursor-pointer"
							disabled={formSubmitting}
							onClick={() =>
								void (mode === "create" ? submitCreate() : submitEdit())
							}
						>
							{formSubmitting ? "Збереження…" : "Зберегти"}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	);
}
