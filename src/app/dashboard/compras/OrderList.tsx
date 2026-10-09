"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
  productName: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string | null; phone: string | null };
  items: OrderItem[];
};

function formatOrderDate(value: string) {
  return new Date(value).toLocaleString("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function OrderList({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const pendingOrders = orders.filter((order) => order.status === "PENDING");
  const completedOrders = orders.filter((order) => order.status !== "PENDING");

  async function updateStatus(id: string, status: "PAID" | "CANCELLED") {
    setLoadingId(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Não foi possível atualizar a reserva.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoadingId(null);
    }
  }

  function renderOrder(order: Order) {
    const isPending = order.status === "PENDING";
    const statusLabel =
      order.status === "PAID"
        ? "Pago"
        : order.status === "CANCELLED"
          ? "Cancelado"
          : "Pendente — pagamento presencial";

    return (
      <article
        key={order.id}
        className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-white">
                {order.user.name ?? "Cliente"}
              </h3>
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  order.status === "PAID"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : order.status === "CANCELLED"
                      ? "border-zinc-700 bg-zinc-800 text-zinc-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                }`}
              >
                {statusLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {order.user.email ?? "Sem email"}
              {order.user.phone ? ` · ${order.user.phone}` : ""}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Reserva feita {formatOrderDate(order.createdAt)}
            </p>
            <ul className="mt-4 space-y-1.5">
              {order.items.map((item, index) => (
                <li
                  key={`${order.id}-${index}`}
                  className="flex flex-wrap items-center gap-x-2 text-sm text-zinc-300"
                >
                  <span className="font-semibold text-white">{item.quantity} ×</span>
                  <span>{item.productName}</span>
                  <span className="text-xs text-zinc-500">
                    ({(item.quantity * item.price).toFixed(2)} €)
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <p className="text-xl font-black text-white">
              {order.total.toFixed(2)} €
            </p>
            {isPending && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loadingId === order.id}
                  onClick={() => updateStatus(order.id, "PAID")}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loadingId === order.id ? "A guardar..." : "Confirmar pagamento"}
                </button>
                <button
                  type="button"
                  disabled={loadingId === order.id}
                  onClick={() => updateStatus(order.id, "CANCELLED")}
                  className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Cancelar e devolver stock
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-7">
      {error && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Por preparar / receber</h2>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
            {pendingOrders.length}
          </span>
        </div>
        {pendingOrders.length ? (
          <div className="space-y-3">{pendingOrders.map(renderOrder)}</div>
        ) : (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-500">
            Não há reservas pendentes. As novas reservas aparecem aqui.
          </p>
        )}
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Histórico de reservas</h2>
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-bold text-zinc-300">
            {completedOrders.length}
          </span>
        </div>
        {completedOrders.length ? (
          <div className="space-y-3">{completedOrders.map(renderOrder)}</div>
        ) : (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-500">
            Ainda não há reservas concluídas nem canceladas.
          </p>
        )}
      </section>
    </div>
  );
}
