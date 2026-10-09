import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "BARBER") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const appointments = await prisma.appointment.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        service: {
          select: { id: true, name: true, price: true, duration: true },
        },
        review: {
          select: { isPrivate: true, topLengthFeedback: true, beardLineFeedback: true },
        },
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("[GET /api/admin/appointments]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
