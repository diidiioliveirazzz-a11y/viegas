import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const items = await prisma.clientHairHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { serviceName, style, photoUrl, notes } = await req.json();

    if (!serviceName || !photoUrl) {
      return NextResponse.json({ error: "Serviço e fotografia são obrigatórios" }, { status: 400 });
    }

    const item = await prisma.clientHairHistory.create({
      data: {
        userId: session.user.id,
        serviceName,
        style: style || null,
        photoUrl,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao registar corte" }, { status: 500 });
  }
}
