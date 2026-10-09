"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
};

function ServiceRow({ service, onToggle }: { service: Service; onToggle: (id: string, isActive: boolean) => void }) {
  return (
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
      <td className="px-6 py-4">
        <p className="text-white font-medium">{service.name}</p>
        {service.description && (
          <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{service.description}</p>
        )}
      </td>
      <td className="px-6 py-4 text-zinc-300 text-sm">{service.price.toFixed(2)} €</td>
      <td className="px-6 py-4 text-zinc-300 text-sm">{service.duration} min</td>
      <td className="px-6 py-4">
        <button
          onClick={() => onToggle(service.id, !service.isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            service.isActive ? "bg-amber-500" : "bg-zinc-700"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              service.isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
            service.isActive
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-zinc-700/50 text-zinc-400 border-zinc-600/30"
          }`}
        >
          {service.isActive ? "Ativo" : "Inativo"}
        </span>
      </td>
    </tr>
  );
}

export default function ServicosClient({ initialServices }: { initialServices: Service[] }) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(id: string, isActive: boolean) {
    // Optimistic update
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive } : s))
    );
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        // Revert
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isActive: !isActive } : s))
        );
      }
      router.refresh();
    } catch {
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !isActive } : s))
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.price || !form.duration) {
      setError("Nome, preço e duração são obrigatórios.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price),
          duration: parseInt(form.duration, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar serviço.");
      } else {
        setServices((prev) => [data.service, ...prev]);
        setForm({ name: "", description: "", price: "", duration: "" });
        setShowForm(false);
        router.refresh();
      }
    } catch {
      setError("Erro de ligação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-3xl font-bold">Serviços</h1>
          <p className="text-zinc-400 mt-1">{services.length} serviços no total</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold rounded-lg transition-colors"
        >
          {showForm ? "✕ Fechar" : "+ Novo Serviço"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Novo Serviço</h2>
          {error && (
            <p className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-2 mb-4">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 text-xs uppercase tracking-widest mb-1.5">
                Nome *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Corte de Cabelo"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs uppercase tracking-widest mb-1.5">
                Descrição
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descrição opcional"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs uppercase tracking-widest mb-1.5">
                Preço (€) *
              </label>
              <input
                type="number"
                min="0"
                step="0.50"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="15.00"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs uppercase tracking-widest mb-1.5">
                Duração (minutos) *
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                placeholder="30"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null); }}
                className="px-4 py-2 text-zinc-400 hover:text-white text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-sm font-semibold rounded-lg transition-colors"
              >
                {submitting ? "A criar..." : "Criar Serviço"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">✂️</p>
            <p className="text-zinc-400">Ainda não há serviços. Cria o primeiro!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-400 text-xs uppercase tracking-widest px-6 py-3 font-medium">Serviço</th>
                <th className="text-left text-zinc-400 text-xs uppercase tracking-widest px-6 py-3 font-medium">Preço</th>
                <th className="text-left text-zinc-400 text-xs uppercase tracking-widest px-6 py-3 font-medium">Duração</th>
                <th className="text-left text-zinc-400 text-xs uppercase tracking-widest px-6 py-3 font-medium">Ativo</th>
                <th className="text-left text-zinc-400 text-xs uppercase tracking-widest px-6 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <ServiceRow key={service.id} service={service} onToggle={handleToggle} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
