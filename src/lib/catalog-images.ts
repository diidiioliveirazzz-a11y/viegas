import { Prisma } from "@prisma/client";

export const MAX_CATALOG_IMAGE_BYTES = 900 * 1024;

export class InvalidCatalogImageError extends Error {}

export async function readCatalogImage(
  formData: FormData,
  required: boolean,
): Promise<Buffer | null> {
  const value = formData.get("image");
  if (value === null || value === "") {
    if (required) throw new InvalidCatalogImageError("Seleciona uma fotografia.");
    return null;
  }

  if (!(value instanceof File) || value.size === 0) {
    throw new InvalidCatalogImageError("O ficheiro enviado não é válido.");
  }
  if (value.type !== "image/webp" || value.size > MAX_CATALOG_IMAGE_BYTES) {
    throw new InvalidCatalogImageError("A imagem deve ser WebP e ter no máximo 900 KB.");
  }

  const data = Buffer.from(await value.arrayBuffer());
  if (
    data.length < 12 ||
    data.toString("ascii", 0, 4) !== "RIFF" ||
    data.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new InvalidCatalogImageError("O conteúdo do ficheiro não é uma imagem WebP válida.");
  }
  return data;
}

export async function createCatalogImage(
  tx: Prisma.TransactionClient,
  data: Buffer,
) {
  const asset = await tx.mediaAsset.create({ data: { data } });
  return `/api/media/${asset.id}`;
}

export async function deleteCatalogImageIfUnused(
  tx: Prisma.TransactionClient,
  imageUrl: string | null | undefined,
) {
  const id = imageUrl?.match(/^\/api\/media\/([\w-]+)$/)?.[1];
  if (!id) return;

  const [styleReferences, productReferences] = await Promise.all([
    tx.hairStyle.count({ where: { imageUrl } }),
    tx.product.count({ where: { imageUrl } }),
  ]);

  if (styleReferences === 0 && productReferences === 0) {
    await tx.mediaAsset.deleteMany({ where: { id } });
  }
}
