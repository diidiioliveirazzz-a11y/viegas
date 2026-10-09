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

export async function GET() {
  try {
    const session = await authorize();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const services = await prisma.service.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("[GET /api/admin/services]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authorize();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, price, duration } = body as {
      name: string;
      description?: string;
      price: number;
      duration: number;
    };

    if (!name || price == null || !duration) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        description: description?.trim() ?? null,
        price: parseFloat(String(price)),
        duration: parseInt(String(duration), 10),
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/services]", error);
    return NextResponse.json({ error: "Erro ao criar serviço" }, { status: 500 });
  }
}
