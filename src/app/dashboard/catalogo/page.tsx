import { prisma } from "@/lib/prisma";
import CatalogClient from "./CatalogClient";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const [styles, products] = await Promise.all([
    prisma.hairStyle.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <CatalogClient
      initialStyles={styles.map(({ id, title, category, description, imageUrl, likes }) => ({
        id,
        title,
        category,
        description,
        imageUrl,
        likes,
      }))}
      initialProducts={products.map(({ id, name, category, description, price, stock, imageUrl }) => ({
        id,
        name,
        category,
        description,
        price,
        stock,
        imageUrl,
      }))}
    />
  );
}
