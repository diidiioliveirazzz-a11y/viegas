import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BARBER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const subscriptions = await prisma.subscription.findMany({
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("[GET /api/admin/subscriptions]", error);
    return NextResponse.json({ error: "Não foi possível carregar as subscrições." }, { status: 500 });
  }
}
