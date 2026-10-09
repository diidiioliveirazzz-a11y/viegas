"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReviewModalProps {
  appointmentId: string;
  serviceName: string;
  dateStr: string;
  onClose: () => void;
}

export default function ReviewModal({
  appointmentId,
  serviceName,
  dateStr,
  onClose,
}: ReviewModalProps) {
  const router = useRouter();
  const [topLengthFeedback, setTopLengthFeedback] = useState("");
  const [beardLineFeedback, setBeardLineFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topLengthFeedback || !beardLineFeedback) {
      setError("Responde às duas perguntas para enviar o feedback.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, topLengthFeedback, beardLineFeedback }),
      });

      const data = await res.json();
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        setError(data.error || "Erro ao guardar avaliação");
      }
    } catch {
      setError("Erro de rede. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Feedback privado</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white transition text-lg"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-zinc-400 mb-6">
          Ajuda o Diogo a lembrar-se das tuas preferências para o próximo <span className="text-pink-600 dark:text-sky-400 font-semibold">{serviceName}</span> ({dateStr}). Só o barbeiro verá as respostas.
        </p>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-300 rounded-lg text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="top-length-feedback" className="mb-2 block text-xs font-semibold text-slate-600 dark:text-zinc-400">
              O tamanho no topo ficou ideal ou querias mais curto?
            </label>
            <select
              id="top-length-feedback"
              value={topLengthFeedback}
              onChange={(event) => setTopLengthFeedback(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            >
              <option value="">Escolhe uma resposta</option>
              <option value="Ideal">Ficou ideal</option>
              <option value="Mais curto">Queria mais curto</option>
              <option value="Mais comprido">Queria mais comprido</option>
            </select>
          </div>

          <div>
            <label htmlFor="beard-line-feedback" className="mb-2 block text-xs font-semibold text-slate-600 dark:text-zinc-400">
              A linha da barba ficou como gostas?
            </label>
            <select
              id="beard-line-feedback"
              value={beardLineFeedback}
              onChange={(event) => setBeardLineFeedback(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            >
              <option value="">Escolhe uma resposta</option>
              <option value="Está perfeita">Está perfeita</option>
              <option value="Mais marcada">Queria mais marcada</option>
              <option value="Mais natural">Queria mais natural</option>
              <option value="Não aplicável">Não se aplica</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-xl text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 hover:opacity-95 text-white dark:bg-sky-400 dark:bg-none dark:hover:bg-sky-300 dark:text-zinc-950 rounded-xl text-sm font-bold transition disabled:opacity-50"
            >
              {loading ? "A enviar..." : "Enviar feedback privado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
