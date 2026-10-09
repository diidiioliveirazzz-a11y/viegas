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
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const status =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).status
      : null;
  if (status !== "PAID" && status !== "CANCELLED") {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!current) throw new Error("Reserva não encontrada.");
      if (current.status !== "PENDING") {
        throw new Error("Só é possível atualizar reservas pendentes.");
      }

      const updated = await tx.order.updateMany({
        where: { id, status: "PENDING" },
        data: { status },
      });
      if (updated.count !== 1) {
        throw new Error("A reserva foi atualizada noutro pedido.");
      }

      if (status === "CANCELLED") {
        for (const item of current.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      } else {
        await tx.notification.create({
          data: {
            userId: current.userId,
            title: "Pagamento confirmado",
            message:
              "O pagamento da tua reserva de produtos foi confirmado. Obrigado pela preferência!",
            type: "INFO",
          },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      });
    });
    return NextResponse.json({ order });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Reserva não encontrada." ||
        error.message === "Só é possível atualizar reservas pendentes." ||
        error.message === "A reserva foi atualizada noutro pedido.")
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[PATCH /api/admin/orders/[id]]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a reserva." },
      { status: 500 }
    );
  }
}
