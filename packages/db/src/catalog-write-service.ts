import type { Gender } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "./client.js";

export type { Gender };

export async function createCategory(data: {
  id: bigint;
  name: string;
  parentId?: bigint | null;
}) {
  return prisma.category.create({
    data: {
      id: data.id,
      name: data.name.trim(),
      parentId: data.parentId ?? null,
      updatedAt: new Date(),
    },
  });
}

export async function updateCategory(
  id: bigint,
  data: { name?: string; parentId?: bigint | null },
) {
  const patch: {
    name?: string;
    parentId?: bigint | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };
  if (data.name !== undefined) patch.name = data.name.trim();
  if (data.parentId !== undefined) patch.parentId = data.parentId;
  return prisma.category.update({
    where: { id },
    data: patch,
  });
}

export type ProductUpdatePayload = Partial<{
  title: string | null;
  description: string | null;
  categoryId: bigint | null;
  gender: Gender;
  brand: string | null;
  fabric: string | null;
  country: string | null;
  productKind: string | null;
  feedShopName: string | null;
}>;

export type ProductCreatePayload = Partial<{
  title: string | null;
  description: string | null;
  categoryId: bigint | null;
  gender: Gender;
  brand: string | null;
  fabric: string | null;
  country: string | null;
  productKind: string | null;
  feedShopName: string | null;
}>;

export async function createProduct(data: ProductCreatePayload = {}) {
  const now = new Date();
  const groupKey = `manual:${randomUUID()}`;
  return prisma.product.create({
    data: {
      groupKey,
      title: data.title ?? null,
      description: data.description ?? null,
      categoryId: data.categoryId ?? null,
      gender: data.gender ?? "unknown",
      brand: data.brand ?? null,
      fabric: data.fabric ?? null,
      country: data.country ?? null,
      productKind: data.productKind ?? null,
      feedShopName: data.feedShopName ?? null,
      updatedAt: now,
    },
  });
}

export async function updateProduct(id: string, data: ProductUpdatePayload) {
  const dataPayload: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) dataPayload.title = data.title;
  if (data.description !== undefined) dataPayload.description = data.description;
  if (data.categoryId !== undefined) dataPayload.categoryId = data.categoryId;
  if (data.gender !== undefined) dataPayload.gender = data.gender;
  if (data.brand !== undefined) dataPayload.brand = data.brand;
  if (data.fabric !== undefined) dataPayload.fabric = data.fabric;
  if (data.country !== undefined) dataPayload.country = data.country;
  if (data.productKind !== undefined) dataPayload.productKind = data.productKind;
  if (data.feedShopName !== undefined)
    dataPayload.feedShopName = data.feedShopName;

  return prisma.product.update({
    where: { id },
    data: dataPayload,
  });
}

export async function createProductColor(
  productId: string,
  data: { colorName: string; sortOrder?: number; imageUrls?: string[] },
) {
  return prisma.productColor.create({
    data: {
      productId,
      colorName: data.colorName.trim(),
      sortOrder: data.sortOrder ?? 0,
      imageUrls: data.imageUrls ?? [],
    },
  });
}

export type SkuCreatePayload = {
  productColorId: string;
  barcode: string;
  externalOfferId?: string | null;
  sizeLabel?: string | null;
  price: string | number;
  oldPrice: string | number;
  currency?: string;
  stockQuantity?: number | null;
  available?: boolean;
};

export async function createSku(productId: string, data: SkuCreatePayload) {
  return prisma.sku.create({
    data: {
      productId,
      productColorId: data.productColorId,
      barcode: data.barcode.trim(),
      externalOfferId: data.externalOfferId ?? null,
      sizeLabel: data.sizeLabel ?? null,
      price: data.price,
      oldPrice: data.oldPrice,
      currency: data.currency ?? "UAH",
      stockQuantity: data.stockQuantity ?? null,
      available: data.available ?? true,
    },
  });
}

export type SkuUpdatePayload = Partial<{
  sizeLabel: string | null;
  price: string | number;
  oldPrice: string | number;
  available: boolean;
}>;

export async function updateSkuByBarcode(barcode: string, patch: SkuUpdatePayload) {
  const dataPayload: Record<string, unknown> = {};
  if (patch.sizeLabel !== undefined) dataPayload.sizeLabel = patch.sizeLabel;
  if (patch.price !== undefined) dataPayload.price = patch.price;
  if (patch.oldPrice !== undefined) dataPayload.oldPrice = patch.oldPrice;
  if (patch.available !== undefined) dataPayload.available = patch.available;

  return prisma.sku.update({
    where: { barcode },
    data: dataPayload,
  });
}

export async function getSkuByBarcode(barcode: string) {
  return prisma.sku.findUnique({ where: { barcode } });
}

export async function deleteSkuByBarcode(barcode: string) {
  return prisma.sku.delete({ where: { barcode } });
}

export async function deleteProduct(productId: string) {
  return prisma.product.delete({ where: { id: productId } });
}

export async function deleteProductColor(productColorId: string) {
  return prisma.productColor.delete({ where: { id: productColorId } });
}
