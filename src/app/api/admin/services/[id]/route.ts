import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function authorize() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "BARBER") return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  ctx: any
) {
  try {
    const session = await authorize();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (body.name) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.price !== undefined) data.price = parseFloat(String(body.price));
    if (body.duration !== undefined) data.duration = parseInt(String(body.duration), 10);

    const service = await prisma.service.update({
      where: { id },
      data,
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error("[PATCH /api/admin/services/[id]]", error);
    return NextResponse.json({ error: "Erro ao atualizar serviço" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: any
) {
  try {
    const session = await authorize();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await ctx.params;

    await prisma.service.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/services/[id]]", error);
    return NextResponse.json({ error: "Erro ao eliminar serviço" }, { status: 500 });
  }
}
