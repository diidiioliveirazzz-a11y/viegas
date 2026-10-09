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

export async function POST(request: Request) {
  try {
    if (!(await isStaff())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!title || title.length > 100 || !category || category.length > 60 || description.length > 500) {
      return NextResponse.json({ error: "Confirma o título, a categoria e a descrição." }, { status: 400 });
    }

    const image = await readCatalogImage(formData, true);
    if (!image) {
      return NextResponse.json({ error: "Seleciona uma fotografia." }, { status: 400 });
    }

    const style = await prisma.$transaction(async (tx) => {
      const imageUrl = await createCatalogImage(tx, image);
      return tx.hairStyle.create({
        data: { title, category, description: description || null, imageUrl },
      });
    });

    return NextResponse.json({ style }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidCatalogImageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[POST /api/admin/hair-styles]", error);
    return NextResponse.json({ error: "Não foi possível guardar o corte." }, { status: 500 });
  }
}
