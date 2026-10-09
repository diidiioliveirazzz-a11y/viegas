"use client";

import { useState } from "react";
import ReviewModal from "./ReviewModal";

interface AppointmentItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  subscriptionId: string | null;
  reviewAvailableAt: string | null;
  canSubmitFeedback: boolean;
  companionName: string | null;
  service: {
    name: string;
    price: number;
    duration: number;
  };
  review: {
    rating: number;
    comment: string | null;
    isPrivate: boolean;
    topLengthFeedback: string | null;
    beardLineFeedback: string | null;
  } | null;
}

export default function ClientAppointmentsList({
  appointments,
  initialReviewId,
}: {
  appointments: AppointmentItem[];
  initialReviewId?: string;
}) {
  const [selectedForReview, setSelectedForReview] = useState<AppointmentItem | null>(
    () => appointments.find((appointment) =>
      appointment.id === initialReviewId &&
      appointment.status === "COMPLETED" &&
      !appointment.review &&
      appointment.canSubmitFeedback
    ) ?? null
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <span className="px-3 py-1 bg-pink-500/10 text-pink-600 border border-pink-500/30 rounded-full text-xs font-semibold dark:bg-sky-400/10 dark:text-sky-400 dark:border-sky-400/30">Agendada</span>;
      case "COMPLETED":
        return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-600/30 rounded-full text-xs font-semibold dark:text-emerald-400 dark:border-emerald-500/30">Concluída</span>;
      case "CANCELLED":
        return <span className="px-3 py-1 bg-red-500/10 text-red-700 border border-red-600/30 rounded-full text-xs font-semibold dark:text-red-400 dark:border-red-500/30">Cancelada</span>;
      case "NO_SHOW":
        return <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-xs font-semibold dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">Não compareceu</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold dark:bg-zinc-800 dark:text-zinc-400">{status}</span>;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {appointments.map((app) => {
          const dateObj = new Date(app.date);
          const formattedDate = dateObj.toLocaleDateString("pt-PT", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          return (
            <div
              key={app.id}
              className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{app.service.name}</h3>
                  {getStatusBadge(app.status)}
                </div>
                <p className="text-sm text-slate-600 dark:text-zinc-400 capitalize mb-1">
                  📅 {formattedDate} às <span className="text-pink-600 dark:text-sky-400 font-semibold">{app.startTime}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-500">
                  Duração: ~{app.service.duration} min • Valor: {app.service.price.toFixed(2)}€
                </p>
                {app.companionName && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Reserva Duo · com {app.companionName}</p>
                )}
                {app.subscriptionId && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Incluído no plano mensal</p>
                )}

                {app.review && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300">
                    {app.review.isPrivate
                      ? "✓ Feedback privado enviado ao Diogo"
                      : <><span className="text-pink-600 dark:text-sky-400 mr-2">{"★".repeat(app.review.rating)}</span>{app.review.comment ? `"${app.review.comment}"` : "Avaliação registada"}</>}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {app.status === "COMPLETED" && !app.review &&
                  app.canSubmitFeedback && (
                  <button
                    onClick={() => setSelectedForReview(app)}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-sm font-bold text-zinc-950 transition hover:bg-amber-400"
                  >
                    Feedback privado
                  </button>
                )}
                <a
                  href="/marcar"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-xl transition"
                >
                  Marcar Novamente
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {selectedForReview && (
        <ReviewModal
          appointmentId={selectedForReview.id}
          serviceName={selectedForReview.service.name}
          dateStr={new Date(selectedForReview.date).toLocaleDateString("pt-PT")}
          onClose={() => setSelectedForReview(null)}
        />
      )}
    </>
  );
}
