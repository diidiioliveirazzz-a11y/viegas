"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  isSilent: boolean;
  musicRequest: string | null;
  companionName: string | null;
  subscriptionUsed?: boolean;
  review: {
    isPrivate: boolean;
    topLengthFeedback: string | null;
    beardLineFeedback: string | null;
  } | null;
  user: { name: string | null; email: string | null; phone: string | null };
  service: { name: string; price: number; duration: number };
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Agendada", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  COMPLETED: { label: "Concluída", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  CANCELLED: { label: "Cancelada", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  NO_SHOW: { label: "Não compareceu", color: "bg-zinc-700/50 text-zinc-400 border-zinc-600/30" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_LABELS[status] ?? {
    label: status,
    color: "bg-zinc-700/50 text-zinc-400 border-zinc-600/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function AppointmentCard({
  appointment,
  onStatusChange,
}: {
  appointment: Appointment;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(status: string) {
    setLoading(status);
    await onStatusChange(appointment.id, status);
    setLoading(null);
  }

  const isFinished =
    appointment.status === "COMPLETED" ||
    appointment.status === "CANCELLED" ||
    appointment.status === "NO_SHOW";

  return (
    <div className="flex gap-4 items-start py-4 border-b border-zinc-800 last:border-0">
      {/* Time column */}
      <div className="w-20 flex-shrink-0 text-center">
        <p className="text-amber-500 font-bold text-base">{appointment.startTime}</p>
        <p className="text-zinc-500 text-xs">{appointment.endTime}</p>
      </div>

      {/* Divider line */}
      <div className="flex flex-col items-center pt-1">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
        <div className="w-px flex-1 bg-zinc-800 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-white font-semibold">
              {appointment.user.name ?? appointment.user.email ?? "Cliente"}
            </p>
            <p className="text-amber-400 text-sm">{appointment.service.name}</p>
            {appointment.companionName && (
              <p className="mt-1 text-xs text-amber-300">Marcação Duo · com {appointment.companionName}</p>
            )}
            {appointment.subscriptionUsed && (
              <p className="mt-1 text-xs text-emerald-300">Incluído na subscrição</p>
            )}
            {appointment.isSilent && <p className="mt-1 text-xs text-zinc-400">🤫 Corte silencioso</p>}
            {appointment.musicRequest && <p className="mt-1 text-xs text-zinc-400">🎵 Pedido musical: {appointment.musicRequest}</p>}
            {appointment.user.phone && (
              <p className="text-zinc-500 text-xs mt-0.5">📞 {appointment.user.phone}</p>
            )}
            {appointment.notes && (
              <p className="text-zinc-400 text-xs mt-1 italic">“{appointment.notes}”</p>
            )}
            {appointment.review?.isPrivate && (
              <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-zinc-300">
                <p className="mb-1 font-bold text-amber-400">Feedback privado</p>
                {appointment.review.topLengthFeedback && <p>Topo: {appointment.review.topLengthFeedback}</p>}
                {appointment.review.beardLineFeedback && <p>Barba: {appointment.review.beardLineFeedback}</p>}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={appointment.status} />
            <p className="text-zinc-300 text-sm font-medium">
              {appointment.subscriptionUsed
                ? "Plano mensal"
                : `${appointment.service.price.toFixed(2)} €`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {!isFinished && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleAction("COMPLETED")}
              disabled={!!loading}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
            >
              {loading === "COMPLETED" ? "..." : "✓ Concluída"}
            </button>
            <button
              onClick={() => handleAction("NO_SHOW")}
              disabled={!!loading}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-zinc-700/50 text-zinc-400 border border-zinc-600/20 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {loading === "NO_SHOW" ? "..." : "👻 Não compareceu"}
            </button>
            <button
              onClick={() => handleAction("CANCELLED")}
              disabled={!!loading}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            >
              {loading === "CANCELLED" ? "..." : "✗ Cancelar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgendaClient({
  appointments: initialAppointments,
}: {
  appointments: Appointment[];
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Erro ao atualizar marcação");
        return;
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      router.refresh();
    } catch {
      alert("Erro de ligação. Tenta novamente.");
    }
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-5xl mb-4">😴</p>
        <p className="text-zinc-400 text-lg font-medium">Sem marcações para este dia</p>
        <p className="text-zinc-600 text-sm mt-1">Escolhe outra data para consultar a agenda.</p>
      </div>
    );
  }

  return (
    <div>
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
