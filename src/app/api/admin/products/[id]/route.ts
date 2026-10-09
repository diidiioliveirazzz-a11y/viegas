import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  createCatalogImage,
  deleteCatalogImageIfUnused,
  InvalidCatalogImageError,
  readCatalogImage,
} from "@/lib/catalog-images";
import { prisma } from "@/lib/prisma";

async function isStaff() {
  const session = await getServerSession(authOptions);
  return session?.user.role === "ADMIN" || session?.user.role === "BARBER";
}

function parseProductFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));

  if (
    !name ||
    name.length > 100 ||
    !category ||
    category.length > 60 ||
    description.length > 500 ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    return null;
  }
  return { name, category, description, price, stock };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isStaff())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const fields = parseProductFields(formData);
    if (!fields) {
      return NextResponse.json({ error: "Confirma o nome, categoria, preço e stock." }, { status: 400 });
    }

    const image = await readCatalogImage(formData, false);
    const product = await prisma.$transaction(async (tx) => {
      const current = await tx.product.findUnique({ where: { id } });
      if (!current) return null;

      const imageUrl = image ? await createCatalogImage(tx, image) : current.imageUrl;
      const updated = await tx.product.update({
        where: { id },
        data: { ...fields, description: fields.description || null, imageUrl },
      });
      if (image) await deleteCatalogImageIfUnused(tx, current.imageUrl);
      return updated;
    });

    if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof InvalidCatalogImageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[PATCH /api/admin/products/[id]]", error);
    return NextResponse.json({ error: "Não foi possível atualizar o produto." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isStaff())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.product.findUnique({ where: { id } });
      if (!current) return "missing";
      const hasOrderHistory = (await tx.orderItem.count({ where: { productId: id } })) > 0;
      if (hasOrderHistory) return "used";

      await tx.product.delete({ where: { id } });
      await deleteCatalogImageIfUnused(tx, current.imageUrl);
      return "deleted";
    });

    if (result === "missing") {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }
    if (result === "used") {
      return NextResponse.json({
        error: "Este produto tem reservas associadas e não pode ser eliminado. Define o stock como 0 para o marcar como esgotado.",
      }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/products/[id]]", error);
    return NextResponse.json({ error: "Não foi possível eliminar o produto." }, { status: 500 });
  }
}
