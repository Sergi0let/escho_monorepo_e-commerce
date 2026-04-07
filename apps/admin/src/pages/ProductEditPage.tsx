import {
	fetchNavCategories,
	fetchProductColorsWithSkus,
	fetchProductDetail,
	updateAdminProduct,
} from "@/lib/catalog-api-client";
import type { CategoryRow, ColorWithSkus, ProductDetail } from "@/lib/catalog-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

const NONE_CATEGORY = "__none";
const GENDERS = ["male", "female", "unisex", "unknown"] as const;

function formatMutationError(e: unknown): string {
	const msg = e instanceof Error ? e.message : "Невідома помилка";
	if (msg.includes("401")) {
		return `${msg} Задайте VITE_CATALOG_ADMIN_API_KEY (як ADMIN_API_KEY на catalog-api).`;
	}
	return msg;
}

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

function productToDraft(p: ProductDetail): Draft {
	return {
		title: p.title ?? "",
		description: p.description ?? "",
		brand: p.brand ?? "",
		fabric: p.fabric ?? "",
		country: p.country ?? "",
		product_kind: p.product_kind ?? "",
		feed_shop_name: p.feed_shop_name ?? "",
		category_id: p.category_id ?? NONE_CATEGORY,
		gender: p.gender ?? "unknown",
	};
}

function uuidOk(id: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		id,
	);
}

export default function ProductEditPage() {
	const { id: rawId } = useParams<{ id: string }>();
	const id = rawId ?? "";

	const [product, setProduct] = useState<ProductDetail | null>(null);
	const [colors, setColors] = useState<ColorWithSkus[]>([]);
	const [categories, setCategories] = useState<CategoryRow[]>([]);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const [draft, setDraft] = useState<Draft | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const validHref = uuidOk(id);

	const load = useCallback(async () => {
		if (!validHref) {
			setLoading(false);
			setProduct(null);
			setColors([]);
			setLoadError(null);
			return;
		}
		setLoading(true);
		setLoadError(null);
		try {
			const [det, cols, cats] = await Promise.all([
				fetchProductDetail(id),
				fetchProductColorsWithSkus(id).catch(() => [] as ColorWithSkus[]),
				fetchNavCategories(200),
			]);
			setCategories(cats);
			setProduct(det);
			setColors(cols);
			if (det) setDraft(productToDraft(det));
			else setDraft(null);
		} catch (e: unknown) {
			setLoadError(e instanceof Error ? e.message : "Помилка завантаження");
			setProduct(null);
			setDraft(null);
			setColors([]);
		} finally {
			setLoading(false);
		}
	}, [id, validHref]);

	useEffect(() => {
		void load();
	}, [load]);

	const categoryOptions = useMemo(
		() => [...categories].sort((a, b) => a.name.localeCompare(b.name, "uk")),
		[categories],
	);

	const save = async () => {
		if (!validHref || !draft) return;
		setSaveError(null);
		setSaving(true);
		try {
			const updated = await updateAdminProduct(id, {
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
				category_id:
					draft.category_id === NONE_CATEGORY ? null : draft.category_id,
				gender: draft.gender,
			});
			setProduct(updated);
			setDraft(productToDraft(updated));
		} catch (e: unknown) {
			setSaveError(formatMutationError(e));
		} finally {
			setSaving(false);
		}
	};

	if (!validHref) {
		return (
			<div className="space-y-4 p-4">
				<p className="text-destructive text-sm" role="alert">
					Некоректний ID товару (очікується UUID).
				</p>
				<Button asChild variant="outline" className="cursor-pointer">
					<Link to="/products">До списку товарів</Link>
				</Button>
			</div>
		);
	}

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

	if (!product || !draft) {
		return (
			<div className="space-y-4 p-4">
				<p className="text-muted-foreground">Товар не знайдено.</p>
				<Button asChild variant="outline" className="cursor-pointer">
					<Link to="/products">До списку товарів</Link>
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

			<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
				<div className="space-y-6">
					<div>
						<h1 className="text-xl font-semibold tracking-tight">
							Редагування товару
						</h1>
						<p className="text-muted-foreground mt-1 font-mono text-xs break-all">
							{id}
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
									setDraft((d) => (d ? { ...d, title: e.target.value } : d))
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
									setDraft((d) =>
										d ? { ...d, description: e.target.value } : d,
									)
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
										setDraft((d) => (d ? { ...d, brand: e.target.value } : d))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="p-fabric">Тканина</Label>
								<Input
									id="p-fabric"
									value={draft.fabric}
									onChange={(e) =>
										setDraft((d) => (d ? { ...d, fabric: e.target.value } : d))
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
										setDraft((d) =>
											d ? { ...d, country: e.target.value } : d,
										)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="p-kind">Вид (product_kind)</Label>
								<Input
									id="p-kind"
									value={draft.product_kind}
									onChange={(e) =>
										setDraft((d) =>
											d ? { ...d, product_kind: e.target.value } : d,
										)
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
									setDraft((d) =>
										d ? { ...d, feed_shop_name: e.target.value } : d,
									)
								}
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label>Категорія</Label>
								<Select
									value={draft.category_id}
									onValueChange={(v) =>
										setDraft((d) => (d ? { ...d, category_id: v } : d))
									}
								>
									<SelectTrigger className="w-full cursor-pointer">
										<SelectValue placeholder="Не обрано" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem
											value={NONE_CATEGORY}
											className="cursor-pointer"
										>
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
									onValueChange={(v) =>
										setDraft((d) => (d ? { ...d, gender: v } : d))
									}
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
							onClick={() => void save()}
						>
							{saving ? "Збереження…" : "Зберегти зміни"}
						</Button>
						<p className="text-muted-foreground text-xs">
							PATCH{" "}
							<code className="rounded bg-muted px-1">/api/admin/products/:id</code>
						</p>
					</div>
				</div>

				<div className="space-y-4">
					<h2 className="text-lg font-medium">Кольори та SKU (з БД, лише перегляд)</h2>
					{colors.length === 0 ? (
						<p className="text-muted-foreground text-sm">Немає варіантів кольору.</p>
					) : (
						<div className="space-y-8">
							{colors.map((c) => (
								<section
									key={c.id}
									className="rounded-lg border border-border p-4"
								>
									<div className="mb-3 flex flex-wrap items-start justify-between gap-2">
										<h3 className="font-medium">{c.color_name}</h3>
										<span className="text-muted-foreground font-mono text-xs">
											{c.id}
										</span>
									</div>
									{c.image_urls && c.image_urls.length > 0 ? (
										<div className="mb-4 flex flex-wrap gap-2">
											{c.image_urls.map((src) => (
												<img
													key={src}
													src={src}
													alt=""
													className="h-16 w-16 rounded-md object-cover"
													referrerPolicy="no-referrer"
												/>
											))}
										</div>
									) : null}
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Штрихкод</TableHead>
												<TableHead>Розмір</TableHead>
												<TableHead>Ціна</TableHead>
												<TableHead>Стара ціна</TableHead>
												<TableHead>Наявність</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{c.skus.length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={5}
														className="text-muted-foreground text-sm"
													>
														Немає SKU
													</TableCell>
												</TableRow>
											) : (
												c.skus.map((s) => (
													<TableRow key={s.barcode}>
														<TableCell className="font-mono text-xs">
															{s.barcode}
														</TableCell>
														<TableCell>{s.size_label ?? "—"}</TableCell>
														<TableCell className="tabular-nums">{s.price}</TableCell>
														<TableCell className="tabular-nums">
															{s.old_price}
														</TableCell>
														<TableCell>{s.available ? "Так" : "Ні"}</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</section>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
