"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionClient({ currentStatus }: { currentStatus?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function requestSubscription() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/subscriptions", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Não foi possível pedir a subscrição.");
        return;
      }
      setStatus("PENDING_CASH");
      setMessage("Pedido criado. O plano fica ativo depois do pagamento em numerário na barbearia.");
      router.refresh();
    } catch {
      setMessage("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {message && <p role="status" className="text-sm text-amber-600 dark:text-amber-400">{message}</p>}
      <button
        type="button"
        onClick={requestSubscription}
        disabled={loading || status === "PENDING_CASH" || status === "ACTIVE"}
        className="w-full rounded-xl bg-amber-500 px-5 py-3 font-bold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "A registar..." : status === "ACTIVE" ? "Plano ativo" : status === "PENDING_CASH" ? "Pedido pendente de pagamento" : "Pedir subscrição · 40€/mês"}
      </button>
    </div>
  );
}
