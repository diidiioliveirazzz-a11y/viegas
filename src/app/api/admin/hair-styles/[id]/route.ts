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
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!title || title.length > 100 || !category || category.length > 60 || description.length > 500) {
      return NextResponse.json({ error: "Confirma o título, a categoria e a descrição." }, { status: 400 });
    }

    const image = await readCatalogImage(formData, false);
    const style = await prisma.$transaction(async (tx) => {
      const current = await tx.hairStyle.findUnique({ where: { id } });
      if (!current) return null;

      const imageUrl = image ? await createCatalogImage(tx, image) : current.imageUrl;
      const updated = await tx.hairStyle.update({
        where: { id },
        data: { title, category, description: description || null, imageUrl },
      });
      if (image) await deleteCatalogImageIfUnused(tx, current.imageUrl);
      return updated;
    });

    if (!style) return NextResponse.json({ error: "Corte não encontrado." }, { status: 404 });
    return NextResponse.json({ style });
  } catch (error) {
    if (error instanceof InvalidCatalogImageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[PATCH /api/admin/hair-styles/[id]]", error);
    return NextResponse.json({ error: "Não foi possível atualizar o corte." }, { status: 500 });
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
    const deleted = await prisma.$transaction(async (tx) => {
      const current = await tx.hairStyle.findUnique({ where: { id } });
      if (!current) return false;
      await tx.hairStyle.delete({ where: { id } });
      await deleteCatalogImageIfUnused(tx, current.imageUrl);
      return true;
    });

    if (!deleted) return NextResponse.json({ error: "Corte não encontrado." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/hair-styles/[id]]", error);
    return NextResponse.json({ error: "Não foi possível eliminar o corte." }, { status: 500 });
  }
}
