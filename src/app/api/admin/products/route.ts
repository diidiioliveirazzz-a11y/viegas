import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  createCatalogImage,
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

export async function POST(request: Request) {
  try {
    if (!(await isStaff())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const formData = await request.formData();
    const fields = parseProductFields(formData);
    if (!fields) {
      return NextResponse.json({ error: "Confirma o nome, categoria, preço e stock." }, { status: 400 });
    }

    const image = await readCatalogImage(formData, false);
    const product = await prisma.$transaction(async (tx) => {
      const imageUrl = image ? await createCatalogImage(tx, image) : null;
      return tx.product.create({
        data: { ...fields, description: fields.description || null, imageUrl },
      });
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidCatalogImageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json({ error: "Não foi possível guardar o produto." }, { status: 500 });
  }
}
