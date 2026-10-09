import { prisma } from "@/lib/prisma";
import OrderList from "./OrderList";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
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

  const serialised = orders.map((order) => ({
    id: order.id,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    user: order.user,
    items: order.items.map((item) => ({
      productName: item.product.name,
      quantity: item.quantity,
      price: item.price,
    })),
  }));

  return (
    <div className="p-5 sm:p-8">
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">
          Loja e pagamentos presenciais
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white">Reservas da Loja</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Vê o cliente, os produtos e quantidades que reservou. Quando receberes o
          dinheiro ao balcão, confirma o pagamento; se a reserva não avançar,
          cancela-a para devolver o stock.
        </p>
      </header>
      <OrderList orders={serialised} />
    </div>
  );
}
