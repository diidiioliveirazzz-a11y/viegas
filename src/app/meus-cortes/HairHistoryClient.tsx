"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HistoryItem {
  id: string;
  date: string;
  serviceName: string;
  style: string | null;
  photoUrl: string;
  notes: string | null;
}

export default function HairHistoryClient({ items }: { items: HistoryItem[] }) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [serviceName, setServiceName] = useState("Corte Fade");
  const [style, setStyle] = useState("Low Taper Fade");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl || !consent) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/hair-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceName, style, notes, photoUrl }),
      });

      if (res.ok) {
        setShowAddModal(false);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Galeria Pessoal</h2>
          <p className="text-xs text-zinc-400">Guarda fotografias dos teus melhores cortes para repetir quando quiseres.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <span>📷 Guardar Novo Corte</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8">
          <p className="text-zinc-400 mb-4">Ainda não tens nenhum corte gravado no teu histórico.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition"
          >
            Adicionar a primeira fotografia
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-amber-500/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="h-64 overflow-hidden relative">
                  <img src={item.photoUrl} alt={item.serviceName} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-amber-400 border border-zinc-800">
                    {item.style || item.serviceName}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs text-zinc-500 mb-1">
                    📅 {new Date(item.date).toLocaleDateString("pt-PT")}
                  </p>
                  <h3 className="font-bold text-white text-base mb-2">{item.serviceName}</h3>
                  {item.notes && <p className="text-xs text-zinc-400 italic mb-4">"{item.notes}"</p>}
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  href={`/marcar?ref=${encodeURIComponent(item.style || item.serviceName)}`}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl text-center block transition shadow-lg shadow-amber-500/10"
                >
                  ✂️ Quero Novamente Este Corte
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Adicionar Corte */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Guardar Referência de Corte</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Serviço</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Estilo / Detalhes</label>
                <input
                  type="text"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="Ex: Mid Fade, penteado para trás..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Fotografia do Corte</label>
                <div className="border border-dashed border-zinc-700 rounded-xl p-4 text-center bg-zinc-950">
                  {photoUrl ? (
                    <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden mb-2">
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : null}
                  <input type="file" accept="image/*" onChange={handleFileUpload} required className="text-xs text-zinc-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Notas do Diogo (opcional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Pente 1.5 nas laterais, tesoura em cima..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-700 text-amber-500"
                    required
                  />
                  <span>
                    Autorizo o armazenamento desta fotografia na minha conta para servir de referência aos meus futuros cortes na Viegas Barber.
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !consent || !photoUrl}
                  className="w-1/2 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition disabled:opacity-50"
                >
                  {submitting ? "A guardar..." : "Guardar Corte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
