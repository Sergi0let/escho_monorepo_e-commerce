import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAdminProduct, fetchNavCategories } from "@/lib/catalog-api-client";
import type { CategoryRow } from "@/lib/catalog-types";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const NONE_CATEGORY = "__none";
const GENDERS = ["male", "female", "unisex", "unknown"] as const;

type Draft = {
	title: string;
	description: string;
	brand: string;
	fabric: string;
	country: string;
	product_kind: string;
	feed_shop_name: string;
	category_id: string;
	gender: string;
};

function formatMutationError(e: unknown): string {
	const msg = e instanceof Error ? e.message : "Невідома помилка";
	if (msg.includes("401")) {
		return `${msg} Задайте VITE_CATALOG_ADMIN_API_KEY (як ADMIN_API_KEY на catalog-api).`;
	}
	return msg;
}

export default function ProductCreatePage() {
	const nav = useNavigate();

	const [categories, setCategories] = useState<CategoryRow[]>([]);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const [draft, setDraft] = useState<Draft>({
		title: "",
		description: "",
		brand: "",
		fabric: "",
		country: "",
		product_kind: "",
		feed_shop_name: "",
		category_id: NONE_CATEGORY,
		gender: "unknown",
	});

	const [saveError, setSaveError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setLoadError(null);
		try {
			const cats = await fetchNavCategories(200);
			setCategories(cats);
		} catch (e: unknown) {
			setLoadError(e instanceof Error ? e.message : "Помилка завантаження");
			setCategories([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const categoryOptions = useMemo(
		() => [...categories].sort((a, b) => a.name.localeCompare(b.name, "uk")),
		[categories],
	);

	const create = async () => {
		setSaveError(null);
		setSaving(true);
		try {
			const created = await createAdminProduct({
				title: draft.title.trim() === "" ? null : draft.title.trim(),
				description:
					draft.description.trim() === "" ? null : draft.description.trim(),
				brand: draft.brand.trim() === "" ? null : draft.brand.trim(),
				fabric: draft.fabric.trim() === "" ? null : draft.fabric.trim(),
				country: draft.country.trim() === "" ? null : draft.country.trim(),
				product_kind:
					draft.product_kind.trim() === "" ? null : draft.product_kind.trim(),
				feed_shop_name:
					draft.feed_shop_name.trim() === ""
						? null
						: draft.feed_shop_name.trim(),
				category_id: draft.category_id === NONE_CATEGORY ? null : draft.category_id,
				gender: draft.gender,
			});
			nav(`/products/${created.id}`);
		} catch (e: unknown) {
			setSaveError(formatMutationError(e));
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <p className="text-muted-foreground text-sm p-4">Завантаження…</p>;
	}

	if (loadError) {
		return (
			<div className="space-y-4 p-4">
				<p className="text-destructive text-sm" role="alert">
					{loadError}
				</p>
				<Button
					type="button"
					variant="outline"
					className="cursor-pointer"
					onClick={() => void load()}
				>
					Повторити
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-8 pb-10">
			<div className="flex flex-wrap items-center gap-3">
				<Button asChild variant="ghost" size="sm" className="cursor-pointer">
					<Link to="/products" className="flex items-center gap-1">
						<ArrowLeft className="h-4 w-4" />
						Товари
					</Link>
				</Button>
			</div>

			<div className="space-y-6 p-4">
				<div>
					<h1 className="text-xl font-semibold tracking-tight">
						Створити новий товар
					</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Після створення відкриється сторінка редагування.
					</p>
				</div>

				{saveError ? (
					<p className="text-destructive text-sm" role="alert">
						{saveError}
					</p>
				) : null}

				<div className="space-y-4 rounded-lg border border-border p-4">
					<div className="space-y-2">
						<Label htmlFor="p-title">Назва</Label>
						<Input
							id="p-title"
							value={draft.title}
							onChange={(e) =>
								setDraft((d) => ({ ...d, title: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="p-desc">Опис (HTML / текст)</Label>
						<Textarea
							id="p-desc"
							rows={6}
							value={draft.description}
							onChange={(e) =>
								setDraft((d) => ({ ...d, description: e.target.value }))
							}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="p-brand">Бренд</Label>
							<Input
								id="p-brand"
								value={draft.brand}
								onChange={(e) =>
									setDraft((d) => ({ ...d, brand: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="p-fabric">Тканина</Label>
							<Input
								id="p-fabric"
								value={draft.fabric}
								onChange={(e) =>
									setDraft((d) => ({ ...d, fabric: e.target.value }))
								}
							/>
						</div>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="p-country">Країна</Label>
							<Input
								id="p-country"
								value={draft.country}
								onChange={(e) =>
									setDraft((d) => ({ ...d, country: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="p-kind">Вид (product_kind)</Label>
							<Input
								id="p-kind"
								value={draft.product_kind}
								onChange={(e) =>
									setDraft((d) => ({ ...d, product_kind: e.target.value }))
								}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="p-feed">Назва у фіді (feed_shop_name)</Label>
						<Input
							id="p-feed"
							value={draft.feed_shop_name}
							onChange={(e) =>
								setDraft((d) => ({ ...d, feed_shop_name: e.target.value }))
							}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>Категорія</Label>
							<Select
								value={draft.category_id}
								onValueChange={(v) =>
									setDraft((d) => ({ ...d, category_id: v }))
								}
							>
								<SelectTrigger className="w-full cursor-pointer">
									<SelectValue placeholder="Не обрано" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={NONE_CATEGORY} className="cursor-pointer">
										Без категорії
									</SelectItem>
									{categoryOptions.map((c) => (
										<SelectItem
											key={c.id}
											value={c.id}
											className="cursor-pointer"
										>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Стать (gender)</Label>
							<Select
								value={draft.gender}
								onValueChange={(v) => setDraft((d) => ({ ...d, gender: v }))}
							>
								<SelectTrigger className="w-full cursor-pointer">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{GENDERS.map((g) => (
										<SelectItem
											key={g}
											value={g}
											className="cursor-pointer"
										>
											{g}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<Button
						type="button"
						className="cursor-pointer"
						disabled={saving}
						onClick={() => void create()}
					>
						{saving ? "Створення…" : "Створити"}
					</Button>
					<p className="text-muted-foreground text-xs">
						POST <code className="rounded bg-muted px-1">/api/admin/products</code>
					</p>
				</div>
			</div>
		</div>
	);
}

