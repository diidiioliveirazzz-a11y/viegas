"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcceptFlashOffer({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function acceptOffer() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/waitlist/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "A vaga já não está disponível.");
        return;
      }
      router.push("/minhas-marcacoes");
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      <button
        type="button"
        onClick={acceptOffer}
        disabled={loading}
        className="w-full rounded-xl bg-amber-500 px-6 py-3 font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-60"
      >
        {loading ? "A confirmar..." : "Aceitar vaga"}
      </button>
    </div>
  );
}
