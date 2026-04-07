import type { Gender } from "@prisma/client";
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
