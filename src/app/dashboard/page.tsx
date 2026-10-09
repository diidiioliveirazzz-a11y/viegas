import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AgendaClient from "./AgendaClient";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-amber-500" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  await getServerSession(authOptions); // session already guarded by layout

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const todayAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: todayStart, lte: todayEnd },
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      service: { select: { name: true, price: true, duration: true } },
      review: { select: { isPrivate: true, topLengthFeedback: true, beardLineFeedback: true } },
    },
    orderBy: { startTime: "asc" },
  });

  // Stats
  const scheduledToday = todayAppointments.filter(
    (a) => a.status === "SCHEDULED"
  );
  const revenueToday = todayAppointments
    .filter(
      (appointment) =>
        (appointment.status === "COMPLETED" || appointment.status === "SCHEDULED") &&
        !appointment.subscriptionId
    )
    .reduce((sum, a) => sum + a.service.price, 0);

  const nextAppointment = scheduledToday.find((a) => a.startTime > now.toTimeString().slice(0, 5));

  // Serialise dates for client component
  const appointmentsForClient = todayAppointments.map((a) => ({
    id: a.id,
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
    notes: a.notes,
    isSilent: a.isSilent,
    musicRequest: a.musicRequest,
    companionName: a.companionName,
    subscriptionUsed: Boolean(a.subscriptionId),
    review: a.review,
    user: a.user,
    service: a.service,
  }));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-3xl font-bold">Agenda de Hoje</h1>
          <p className="text-zinc-400 mt-1 capitalize">{formatDate(now)}</p>
        </div>
        <Link
          href={`/dashboard/agenda?date=${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Abrir Agenda Completa →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Marcações Hoje"
          value={todayAppointments.length}
          sub={`${scheduledToday.length} pendentes`}
        />
        <StatCard
          label="Receita Estimada"
          value={`${revenueToday.toFixed(2)} €`}
          accent
          sub="marcações de hoje"
        />
        <StatCard
          label="Próxima Marcação"
          value={nextAppointment ? nextAppointment.startTime : "—"}
          sub={
            nextAppointment
              ? `${nextAppointment.user.name ?? "Cliente"} — ${nextAppointment.service.name}`
              : "Sem mais marcações"
          }
        />
      </div>

      {/* Timeline */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">
            Timeline do Dia
          </h2>
          {todayAppointments.length > 0 && (
            <span className="text-zinc-500 text-sm">
              {todayAppointments.length} marcação{todayAppointments.length !== 1 ? "ões" : ""}
            </span>
          )}
        </div>

        <AgendaClient appointments={appointmentsForClient} />
      </div>
    </div>
  );
}
