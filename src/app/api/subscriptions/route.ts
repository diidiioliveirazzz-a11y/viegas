import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ subscriptions });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Inicia sessão para pedir a subscrição." }, { status: 401 });
  }

  try {
    const existing = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["PENDING_CASH", "ACTIVE"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: existing.status === "ACTIVE" ? "Já tens uma subscrição ativa." : "Já tens um pedido pendente de pagamento presencial." },
        { status: 409 }
      );
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        plan: "2 cortes + 2 barbas",
        price: 40,
        status: "PENDING_CASH",
      },
    });
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Pedido de subscrição registado",
        message: "O pedido do plano mensal de 40€ ficou pendente. O Diogo ativa-o depois de receber o pagamento em numerário na barbearia.",
        type: "LOYALTY",
      },
    });
    return NextResponse.json({ success: true, subscription }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/subscriptions]", error);
    return NextResponse.json({ error: "Não foi possível registar o pedido." }, { status: 500 });
  }
}
