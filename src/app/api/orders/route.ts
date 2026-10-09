import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RequestedItem = {
  productId: string;
  quantity: number;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Inicia sessão para reservar produtos." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Carrinho inválido." }, { status: 400 });
  }

  const rawItems = (body as Record<string, unknown>).items;
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 20) {
    return NextResponse.json(
      { error: "O carrinho deve ter entre 1 e 20 produtos." },
      { status: 400 }
    );
  }

  const items: RequestedItem[] = [];
  const seenProductIds = new Set<string>();
  for (const item of rawItems) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as Record<string, unknown>).productId !== "string" ||
      !Number.isInteger((item as Record<string, unknown>).quantity) ||
      Number((item as Record<string, unknown>).quantity) < 1 ||
      Number((item as Record<string, unknown>).quantity) > 10
    ) {
      return NextResponse.json(
        { error: "Um dos produtos ou quantidades não é válido." },
        { status: 400 }
      );
    }

    const productId = (item as Record<string, unknown>).productId as string;
    if (seenProductIds.has(productId)) {
      return NextResponse.json(
        { error: "O carrinho contém produtos repetidos." },
        { status: 400 }
      );
    }
    seenProductIds.add(productId);
    items.push({
      productId,
      quantity: Number((item as Record<string, unknown>).quantity),
    });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((item) => item.productId) } },
        select: { id: true, name: true, price: true, stock: true },
      });
      if (products.length !== items.length) {
        throw new Error("Um dos produtos já não está disponível.");
      }

      const productById = new Map(products.map((product) => [product.id, product]));
      const total = items.reduce((sum, item) => {
        const product = productById.get(item.productId);
        if (!product || product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para ${product?.name ?? "um produto"}.`
          );
        }
        return sum + product.price * item.quantity;
      }, 0);

      for (const item of items) {
        const reserved = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count !== 1) {
          const product = productById.get(item.productId);
          throw new Error(`Stock insuficiente para ${product?.name ?? "um produto"}.`);
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total: Number(total.toFixed(2)),
          status: "PENDING",
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: productById.get(item.productId)!.price,
            })),
          },
        },
        include: { items: { include: { product: { select: { name: true } } } } },
      });

      await tx.notification.create({
        data: {
          userId: session.user.id,
          title: "Produtos reservados",
          message:
            "A tua reserva ficou registada. Os produtos ficam separados para pagamento e levantamento presencial na barbearia.",
          type: "INFO",
        },
      });

      return createdOrder;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Stock insuficiente")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (
      error instanceof Error &&
      error.message === "Um dos produtos já não está disponível."
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[POST /api/orders]", error);
    return NextResponse.json(
      { error: "Não foi possível registar a reserva. Tenta novamente." },
      { status: 500 }
    );
  }
}
