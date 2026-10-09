"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SubscriptionItem = {
  id: string;
  plan: string;
  price: number;
  status: string;
  createdAt: string;
  endsAt: string | null;
  user: { name: string | null; email: string | null; phone: string | null };
};

export default function SubscriptionList({ items }: { items: SubscriptionItem[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState("");
  const [error, setError] = useState("");

  async function updateStatus(id: string, status: "ACTIVE" | "CANCELLED") {
    setLoadingId(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Não foi possível atualizar a subscrição.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoadingId("");
    }
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      {items.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-400">Ainda não há pedidos de subscrição.</p>
      ) : items.map((item) => (
        <article key={item.id} className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-white">{item.user.name ?? item.user.email ?? "Cliente"}</h2>
            <p className="mt-1 text-sm text-zinc-400">{item.plan} · {item.price.toFixed(2)}€ / mês</p>
            <p className="mt-1 text-xs text-zinc-500">{item.user.email ?? ""}{item.user.phone ? ` · ${item.user.phone}` : ""}</p>
            <p className="mt-2 text-xs font-semibold text-amber-400">
              {item.status === "PENDING_CASH" ? "À espera de pagamento presencial" : item.status === "ACTIVE" ? `Ativa${item.endsAt ? ` até ${new Date(item.endsAt).toLocaleDateString("pt-PT")}` : ""}` : item.status}
            </p>
          </div>
          <div className="flex gap-2">
            {item.status === "PENDING_CASH" && (
              <button
                type="button"
                onClick={() => updateStatus(item.id, "ACTIVE")}
                disabled={loadingId === item.id}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
              >
                {loadingId === item.id ? "A guardar..." : "Confirmar numerário"}
              </button>
            )}
            {item.status === "ACTIVE" && (
              <button
                type="button"
                onClick={() => updateStatus(item.id, "CANCELLED")}
                disabled={loadingId === item.id}
                className="rounded-lg border border-red-500/30 px-4 py-2 text-xs font-bold text-red-400 disabled:opacity-50"
              >
                Cancelar plano
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
