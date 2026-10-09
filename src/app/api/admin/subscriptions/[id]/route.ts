import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BARBER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const { status } = await req.json();
    if (status !== "ACTIVE" && status !== "CANCELLED") {
      return NextResponse.json({ error: "Estado de subscrição inválido." }, { status: 400 });
    }

    const current = await prisma.subscription.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Subscrição não encontrada." }, { status: 404 });
    if (status === "ACTIVE" && current.status !== "PENDING_CASH") {
      return NextResponse.json({ error: "Só podes ativar pedidos pendentes de pagamento." }, { status: 409 });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);
    const subscription = await prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id },
        data: status === "ACTIVE"
          ? { status, paidAt: now, startsAt: now, endsAt: endDate, cutsRemaining: 2, beardsRemaining: 2 }
          : { status },
      });
      await tx.user.update({
        where: { id: current.userId },
        data: status === "ACTIVE"
          ? { hasSubscription: true, subscriptionEndsAt: endDate }
          : { hasSubscription: false, subscriptionEndsAt: null },
      });
      await tx.notification.create({
        data: {
          userId: current.userId,
          title: status === "ACTIVE" ? "Subscrição ativada! ✂️" : "Subscrição cancelada",
          message: status === "ACTIVE"
            ? `O teu plano mensal está ativo até ${endDate.toLocaleDateString("pt-PT")}.`
            : "A tua subscrição foi cancelada.",
          type: "LOYALTY",
        },
      });
      return updated;
    });
    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("[PATCH /api/admin/subscriptions/[id]]", error);
    return NextResponse.json({ error: "Não foi possível atualizar a subscrição." }, { status: 500 });
  }
}
