import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BARBER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          include: { product: { select: { name: true } } },
          orderBy: { product: { name: "asc" } },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[GET /api/admin/orders]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as reservas da loja." },
      { status: 500 }
    );
  }
}
