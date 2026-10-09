"use client";

import { useState } from "react";

interface SettingsData {
  id: string;
  minAdvanceHours: number;
  openTime: string;
  closeTime: string;
  lunchStart: string;
  lunchEnd: string;
  phone: string;
  address: string;
  shopName: string;
  barberName: string;
}

export default function SettingsClient({ initialSettings }: { initialSettings: SettingsData }) {
  const [formData, setFormData] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Bloqueio manual de data/horário (férias/folgas)
  const [blockDate, setBlockDate] = useState("");
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("19:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockSuccess, setBlockSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError("Erro ao guardar definições.");
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) return;

    try {
      const res = await fetch("/api/admin/blocked-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: blockDate,
          startTime: blockStart,
          endTime: blockEnd,
          reason: blockReason || "Bloqueio / Folga",
        }),
      });

      if (res.ok) {
        setBlockSuccess(true);
        setBlockReason("");
        setBlockDate("");
        setTimeout(() => setBlockSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Form de Definições Gerais e Antecedência */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Regras de Agendamento & Barbearia</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Qualquer alteração efetuada aqui é imediatamente refletida no site e no fluxo dos clientes.
          </p>
        </div>

        {success && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs mb-6">
            ✓ Definições atualizadas com sucesso!
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-500/50 text-red-300 rounded-xl text-xs mb-6">
            ✕ {error}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Regra de Antecedência Mínima */}
          <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
            <label className="block text-sm font-bold text-amber-400">
              ⚡ Antecedência Mínima para Marcações (em Horas)
            </label>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Resolve o problema das reservas na madrugada: se definires 8 horas, um cliente às 03:00 da madrugada só conseguirá marcar a partir das 11:00 da manhã.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <input
                type="number"
                min={1}
                max={48}
                value={formData.minAdvanceHours}
                onChange={(e) =>
                  setFormData({ ...formData, minAdvanceHours: Number(e.target.value) })
                }
                className="w-28 bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-center font-black text-amber-500 text-lg outline-none focus:border-amber-400"
                required
              />
              <span className="text-xs font-semibold text-zinc-400">horas antes do atendimento</span>
            </div>
          </div>

          {/* Horário de Funcionamento */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Abertura da Barbearia
              </label>
              <input
                type="text"
                value={formData.openTime}
                onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                placeholder="09:00"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Fecho da Barbearia
              </label>
              <input
                type="text"
                value={formData.closeTime}
                onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                placeholder="19:00"
                required
              />
            </div>
          </div>

          {/* Pausa de Almoço */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Início do Almoço
              </label>
              <input
                type="text"
                value={formData.lunchStart}
                onChange={(e) => setFormData({ ...formData, lunchStart: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                placeholder="13:00"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Fim do Almoço
              </label>
              <input
                type="text"
                value={formData.lunchEnd}
                onChange={(e) => setFormData({ ...formData, lunchEnd: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                placeholder="14:00"
                required
              />
            </div>
          </div>

          {/* Informações da Barbearia */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Contacto Telefónico
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Morada / Localização
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {saving ? "A guardar alterações..." : "Guardar Configurações"}
          </button>
        </form>
      </div>

      {/* Bloqueio de Horários / Folgas e Férias */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Bloquear Horário, Folga ou Férias</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Garante que nenhum cliente consegue marcar nos teus dias de descanso ou pausas programadas.
          </p>
        </div>

        {blockSuccess && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs mb-6">
            ✓ Horário bloqueado com sucesso! Nenhuma reserva será permitida neste intervalo.
          </div>
        )}

        <form onSubmit={handleCreateBlock} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Dia do Bloqueio</label>
              <input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Hora Início</label>
              <input
                type="text"
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                placeholder="09:00"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Hora Fim</label>
              <input
                type="text"
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                placeholder="19:00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Motivo do Bloqueio</label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Ex: Formação em Madrid, Folga Pessoal, Férias de Verão..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition"
          >
            + Adicionar Bloqueio na Agenda
          </button>
        </form>
      </div>
    </div>
  );
}
