import {
	createAdminProductColor,
	createAdminSku,
	deleteAdminProduct,
	deleteAdminProductColor,
	deleteAdminSku,
	fetchNavCategories,
	fetchProductColorsWithSkus,
	fetchProductDetail,
	updateAdminProduct,
	updateAdminSku,
} from "@/lib/catalog-api-client";
import type { CategoryRow, ColorWithSkus, ProductDetail } from "@/lib/catalog-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Link, useNavigate, useParams } from "react-router-dom";
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
	const nav = useNavigate();

	const [product, setProduct] = useState<ProductDetail | null>(null);
	const [colors, setColors] = useState<ColorWithSkus[]>([]);
	const [categories, setCategories] = useState<CategoryRow[]>([]);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const [draft, setDraft] = useState<Draft | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const [colorDraft, setColorDraft] = useState<{
		color_name: string;
		sort_order: string;
		image_urls: string;
	}>({ color_name: "", sort_order: "0", image_urls: "" });
	const [colorSaving, setColorSaving] = useState(false);
	const [colorError, setColorError] = useState<string | null>(null);

	const [skuDraft, setSkuDraft] = useState<{
		product_color_id: string;
		barcode: string;
		size_label: string;
		price: string;
		old_price: string;
		available: boolean;
	}>({
		product_color_id: "",
		barcode: "",
		size_label: "",
		price: "",
		old_price: "",
		available: true,
	});
	const [skuSaving, setSkuSaving] = useState(false);
	const [skuError, setSkuError] = useState<string | null>(null);

	type SkuEditState = {
		size_label: string;
		price: string;
		old_price: string;
		available: boolean;
		saving?: boolean;
		error?: string | null;
	};
	const [skuEdits, setSkuEdits] = useState<Record<string, SkuEditState>>({});

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
			if (cols.length > 0 && skuDraft.product_color_id === "") {
				setSkuDraft((d) => ({ ...d, product_color_id: cols[0]?.id ?? "" }));
			}
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

	useEffect(() => {
		setSkuEdits((prev) => {
			const next: Record<string, SkuEditState> = { ...prev };
			for (const c of colors) {
				for (const s of c.skus) {
					if (!next[s.barcode]) {
						next[s.barcode] = {
							size_label: s.size_label ?? "",
							price: s.price ?? "",
							old_price: s.old_price ?? "",
							available: Boolean(s.available),
						};
					}
				}
			}
			return next;
		});
	}, [colors]);

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

	const addColor = async () => {
		if (!validHref) return;
		setColorError(null);
		setColorSaving(true);
		try {
			const sort =
				colorDraft.sort_order.trim() === ""
					? 0
					: Number.parseInt(colorDraft.sort_order.trim(), 10);
			if (!Number.isFinite(sort)) {
				setColorError("sort_order має бути цілим числом.");
				return;
			}
			const image_urls = colorDraft.image_urls
				.split("\n")
				.map((l) => l.trim())
				.filter((l) => l.length > 0);
			const nextColors = await createAdminProductColor(id, {
				color_name: colorDraft.color_name.trim(),
				sort_order: sort,
				image_urls: image_urls.length ? image_urls : undefined,
			});
			setColors(nextColors);
			setColorDraft({ color_name: "", sort_order: "0", image_urls: "" });
		} catch (e: unknown) {
			setColorError(formatMutationError(e));
		} finally {
			setColorSaving(false);
		}
	};

	const addSku = async () => {
		if (!validHref) return;
		setSkuError(null);
		setSkuSaving(true);
		try {
			await createAdminSku(id, {
				product_color_id: skuDraft.product_color_id,
				barcode: skuDraft.barcode.trim(),
				size_label: skuDraft.size_label.trim() === "" ? null : skuDraft.size_label,
				price: skuDraft.price.trim(),
				...(skuDraft.old_price.trim() === ""
					? {}
					: { old_price: skuDraft.old_price.trim() }),
				available: skuDraft.available,
			});
			const cols = await fetchProductColorsWithSkus(id).catch(
				() => [] as ColorWithSkus[],
			);
			setColors(cols);
			setSkuDraft((d) => ({ ...d, barcode: "", size_label: "", price: "", old_price: "" }));
		} catch (e: unknown) {
			setSkuError(formatMutationError(e));
		} finally {
			setSkuSaving(false);
		}
	};

	const saveSku = async (barcode: string) => {
		if (!validHref) return;
		setSkuEdits((m) => ({
			...m,
			[barcode]: { ...m[barcode], saving: true, error: null },
		}));
		try {
			const st = skuEdits[barcode];
			await updateAdminSku(barcode, {
				size_label: st.size_label.trim() === "" ? null : st.size_label,
				price: st.price.trim(),
				old_price: st.old_price.trim(),
				available: st.available,
			});
			const cols = await fetchProductColorsWithSkus(id).catch(
				() => [] as ColorWithSkus[],
			);
			setColors(cols);
		} catch (e: unknown) {
			setSkuEdits((m) => ({
				...m,
				[barcode]: { ...m[barcode], error: formatMutationError(e) },
			}));
		} finally {
			setSkuEdits((m) => ({
				...m,
				[barcode]: { ...m[barcode], saving: false },
			}));
		}
	};

	const removeSku = async (barcode: string) => {
		if (!validHref) return;
		if (!confirm(`Видалити SKU ${barcode}? Цю дію не можна скасувати.`)) return;
		setSkuEdits((m) => ({
			...m,
			[barcode]: { ...m[barcode], saving: true, error: null },
		}));
		try {
			await deleteAdminSku(barcode);
			const cols = await fetchProductColorsWithSkus(id).catch(
				() => [] as ColorWithSkus[],
			);
			setColors(cols);
		} catch (e: unknown) {
			setSkuEdits((m) => ({
				...m,
				[barcode]: { ...m[barcode], error: formatMutationError(e) },
			}));
		} finally {
			setSkuEdits((m) => ({
				...m,
				[barcode]: { ...m[barcode], saving: false },
			}));
		}
	};

	const removeProduct = async () => {
		if (!validHref) return;
		if (
			!confirm(
				"Видалити товар? Буде видалено також всі його кольори та SKU (каскадом). Цю дію не можна скасувати.",
			)
		)
			return;
		setSaveError(null);
		setSaving(true);
		try {
			await deleteAdminProduct(id);
			nav("/products");
		} catch (e: unknown) {
			setSaveError(formatMutationError(e));
		} finally {
			setSaving(false);
		}
	};

	const removeColor = async (productColorId: string, colorName: string) => {
		if (!validHref) return;
		if (
			!confirm(
				`Видалити колір "${colorName}"? Буде видалено також всі SKU цього кольору (каскадом). Цю дію не можна скасувати.`,
			)
		)
			return;
		setColorError(null);
		setColorSaving(true);
		try {
			await deleteAdminProductColor(productColorId);
			const cols = await fetchProductColorsWithSkus(id).catch(
				() => [] as ColorWithSkus[],
			);
			setColors(cols);
		} catch (e: unknown) {
			setColorError(formatMutationError(e));
		} finally {
			setColorSaving(false);
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
				<Button
					type="button"
					variant="destructive"
					size="sm"
					className="cursor-pointer"
					disabled={saving}
					onClick={() => void removeProduct()}
				>
					Видалити товар
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
					<h2 className="text-lg font-medium">Кольори та SKU</h2>

					<div className="space-y-4 rounded-lg border border-border p-4">
						<div>
							<h3 className="font-medium">Додати колір</h3>
							<p className="text-muted-foreground text-xs">
								POST{" "}
								<code className="rounded bg-muted px-1">
									/api/admin/products/:id/colors
								</code>
							</p>
						</div>
						{colorError ? (
							<p className="text-destructive text-sm" role="alert">
								{colorError}
							</p>
						) : null}
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="c-name">Назва кольору (color_name)</Label>
								<Input
									id="c-name"
									value={colorDraft.color_name}
									onChange={(e) =>
										setColorDraft((d) => ({ ...d, color_name: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="c-sort">Sort order</Label>
								<Input
									id="c-sort"
									inputMode="numeric"
									value={colorDraft.sort_order}
									onChange={(e) =>
										setColorDraft((d) => ({ ...d, sort_order: e.target.value }))
									}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="c-img">image_urls (по 1 URL на рядок)</Label>
							<Textarea
								id="c-img"
								rows={3}
								value={colorDraft.image_urls}
								onChange={(e) =>
									setColorDraft((d) => ({ ...d, image_urls: e.target.value }))
								}
							/>
						</div>
						<Button
							type="button"
							className="cursor-pointer"
							disabled={colorSaving || colorDraft.color_name.trim() === ""}
							onClick={() => void addColor()}
						>
							{colorSaving ? "Додавання…" : "Додати колір"}
						</Button>
					</div>

					<div className="space-y-4 rounded-lg border border-border p-4">
						<div>
							<h3 className="font-medium">Додати SKU</h3>
							<p className="text-muted-foreground text-xs">
								POST{" "}
								<code className="rounded bg-muted px-1">
									/api/admin/products/:id/skus
								</code>
							</p>
						</div>
						{skuError ? (
							<p className="text-destructive text-sm" role="alert">
								{skuError}
							</p>
						) : null}
						<div className="grid gap-4 lg:grid-cols-2">
							<div className="space-y-2">
								<Label>Колір</Label>
								<Select
									value={skuDraft.product_color_id}
									onValueChange={(v) =>
										setSkuDraft((d) => ({ ...d, product_color_id: v }))
									}
								>
									<SelectTrigger className="w-full cursor-pointer">
										<SelectValue placeholder="Оберіть колір" />
									</SelectTrigger>
									<SelectContent>
										{colors.map((c) => (
											<SelectItem
												key={c.id}
												value={c.id}
												className="cursor-pointer"
											>
												{c.color_name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="s-barcode">Штрихкод (barcode)</Label>
								<Input
									id="s-barcode"
									value={skuDraft.barcode}
									onChange={(e) =>
										setSkuDraft((d) => ({ ...d, barcode: e.target.value }))
									}
								/>
							</div>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="s-size">Розмір (size_label)</Label>
								<Input
									id="s-size"
									value={skuDraft.size_label}
									onChange={(e) =>
										setSkuDraft((d) => ({ ...d, size_label: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									<Checkbox
										checked={skuDraft.available}
										onCheckedChange={(v) =>
											setSkuDraft((d) => ({ ...d, available: v === true }))
										}
									/>
									Наявність (available)
								</Label>
							</div>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="s-price">Ціна (price)</Label>
								<Input
									id="s-price"
									inputMode="decimal"
									value={skuDraft.price}
									onChange={(e) =>
										setSkuDraft((d) => ({ ...d, price: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="s-old">Стара ціна (old_price)</Label>
								<Input
									id="s-old"
									inputMode="decimal"
									value={skuDraft.old_price}
									onChange={(e) =>
										setSkuDraft((d) => ({ ...d, old_price: e.target.value }))
									}
								/>
							</div>
						</div>
						<Button
							type="button"
							className="cursor-pointer"
							disabled={
								skuSaving ||
								skuDraft.product_color_id.trim() === "" ||
								skuDraft.barcode.trim() === "" ||
								skuDraft.price.trim() === "" ||
								false
							}
							onClick={() => void addSku()}
						>
							{skuSaving ? "Додавання…" : "Додати SKU"}
						</Button>
					</div>

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
										<div className="min-w-0">
											<h3 className="font-medium">{c.color_name}</h3>
											<span className="text-muted-foreground font-mono text-xs break-all">
												{c.id}
											</span>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<Button
												type="button"
												size="sm"
												variant="destructive"
												className="cursor-pointer"
												disabled={colorSaving}
												onClick={() => void removeColor(c.id, c.color_name)}
											>
												Видалити колір
											</Button>
										</div>
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
												<TableHead className="w-[1%]"></TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{c.skus.length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={6}
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
														<TableCell>
															<Input
																value={skuEdits[s.barcode]?.size_label ?? ""}
																onChange={(e) =>
																	setSkuEdits((m) => ({
																		...m,
																		[s.barcode]: {
																			...m[s.barcode],
																			size_label: e.target.value,
																		},
																	}))
																}
															/>
														</TableCell>
														<TableCell className="tabular-nums">
															<Input
																inputMode="decimal"
																value={skuEdits[s.barcode]?.price ?? ""}
																onChange={(e) =>
																	setSkuEdits((m) => ({
																		...m,
																		[s.barcode]: {
																			...m[s.barcode],
																			price: e.target.value,
																		},
																	}))
																}
															/>
														</TableCell>
														<TableCell className="tabular-nums">
															<Input
																inputMode="decimal"
																value={skuEdits[s.barcode]?.old_price ?? ""}
																onChange={(e) =>
																	setSkuEdits((m) => ({
																		...m,
																		[s.barcode]: {
																			...m[s.barcode],
																			old_price: e.target.value,
																		},
																	}))
																}
															/>
														</TableCell>
														<TableCell>
															<Label className="flex items-center gap-2">
																<Checkbox
																	checked={Boolean(skuEdits[s.barcode]?.available)}
																	onCheckedChange={(v) =>
																		setSkuEdits((m) => ({
																			...m,
																			[s.barcode]: {
																				...m[s.barcode],
																				available: v === true,
																			},
																		}))
																	}
																/>
																<span className="text-sm">
																	{skuEdits[s.barcode]?.available ? "Так" : "Ні"}
																</span>
															</Label>
														</TableCell>
														<TableCell className="text-right">
															<div className="flex flex-col items-end gap-2">
																<div className="flex flex-wrap items-center justify-end gap-2">
																	<Button
																		type="button"
																		size="sm"
																		className="cursor-pointer"
																		disabled={skuEdits[s.barcode]?.saving}
																		onClick={() => void saveSku(s.barcode)}
																	>
																		{skuEdits[s.barcode]?.saving
																			? "…"
																			: "Зберегти"}
																	</Button>
																	<Button
																		type="button"
																		size="sm"
																		variant="destructive"
																		className="cursor-pointer"
																		disabled={skuEdits[s.barcode]?.saving}
																		onClick={() => void removeSku(s.barcode)}
																	>
																		Видалити
																	</Button>
																</div>
																{skuEdits[s.barcode]?.error ? (
																	<p className="text-destructive text-xs" role="alert">
																		{skuEdits[s.barcode]?.error}
																	</p>
																) : null}
																<p className="text-muted-foreground text-[10px]">
																	PATCH/DELETE{" "}
																	<code className="rounded bg-muted px-1">
																		/api/admin/skus/:barcode
																	</code>
																</p>
															</div>
														</TableCell>
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
