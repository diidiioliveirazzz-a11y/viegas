import { prisma } from "@/lib/prisma";
import AgendaClient from "../AgendaClient";
import AgendaDatePicker from "./AgendaDatePicker";

export const dynamic = "force-dynamic";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isDateKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
  );
}

export default async function FullAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const params = await searchParams;
  const today = dateKey(new Date());
  const requestedDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const selectedDate = isDateKey(requestedDate) ? requestedDate : today;
  const dayStart = new Date(`${selectedDate}T00:00:00.000Z`);

  const appointments = await prisma.appointment.findMany({
    where: { date: dayStart },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      service: { select: { name: true, price: true, duration: true } },
      review: {
        select: {
          isPrivate: true,
          topLengthFeedback: true,
          beardLineFeedback: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
  const scheduled = appointments.filter((appointment) => appointment.status === "SCHEDULED");
  const cancelled = appointments.filter((appointment) => appointment.status === "CANCELLED");
  const formattedDate = dayStart.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const serialisedAppointments = appointments.map((appointment) => ({
    id: appointment.id,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    notes: appointment.notes,
    isSilent: appointment.isSilent,
    musicRequest: appointment.musicRequest,
    companionName: appointment.companionName,
    subscriptionUsed: Boolean(appointment.subscriptionId),
    review: appointment.review,
    user: appointment.user,
    service: appointment.service,
  }));

  return (
    <div className="p-5 sm:p-8">
      <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">
            Organização diária
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">Agenda Completa</h1>
          <p className="mt-1 capitalize text-zinc-400">{formattedDate}</p>
        </div>
        <AgendaDatePicker selectedDate={selectedDate} today={today} />
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-white">{appointments.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Agendadas</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{scheduled.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Canceladas</p>
          <p className="mt-1 text-2xl font-bold text-zinc-300">{cancelled.length}</p>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">
          Marcações por hora
        </h2>
        <p className="mb-3 text-xs text-zinc-500">
          As canceladas ficam no histórico desse dia; as reservas ativas podem ser
          concluídas, canceladas ou marcadas como falta.
        </p>
        <AgendaClient appointments={serialisedAppointments} />
      </section>
    </div>
  );
}
