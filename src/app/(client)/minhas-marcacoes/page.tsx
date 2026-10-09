import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientAppointmentsList from "./ClientAppointmentsList";

export default async function MinhasMarcacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ feedback?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const appointments = await prisma.appointment.findMany({
    where: { userId: session.user.id },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    include: {
      service: {
        select: { name: true, price: true, duration: true },
      },
      review: {
        select: {
          rating: true,
          comment: true,
          isPrivate: true,
          topLengthFeedback: true,
          beardLineFeedback: true,
        },
      },
    },
  });
  const requestedFeedback = (await searchParams).feedback;
  const feedbackAppointmentId = Array.isArray(requestedFeedback) ? requestedFeedback[0] : requestedFeedback;
  const now = new Date();

  const serialized = appointments.map((a) => ({
    id: a.id,
    date: a.date.toISOString(),
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
    subscriptionId: a.subscriptionId,
    reviewAvailableAt: a.reviewAvailableAt?.toISOString() ?? null,
    canSubmitFeedback: Boolean(a.reviewAvailableAt && a.reviewAvailableAt <= now),
    companionName: a.companionName,
    service: a.service,
    review: a.review,
  }));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white pb-20 transition-colors">
      <header className="p-6 max-w-5xl mx-auto flex justify-between items-center border-b border-slate-200 dark:border-zinc-900">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 hover:text-pink-600 dark:text-white dark:hover:text-sky-400 transition">
          ← VIEGAS BARBER
        </Link>
        <Link
          href="/marcar"
          className="bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 hover:opacity-95 text-white dark:bg-sky-400 dark:bg-none dark:hover:bg-sky-300 dark:text-zinc-950 px-4 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-pink-500/15 dark:shadow-sky-400/15"
        >
          + Nova Marcação
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-2">As Minhas Marcações</h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Acompanha o estado das tuas reservas, histórico de cortes e deixa a tua avaliação.
          </p>
        </div>

        {serialized.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <p className="text-slate-600 dark:text-zinc-400 mb-6">Ainda não tens marcações agendadas ou anteriores.</p>
            <Link
              href="/marcar"
              className="inline-block bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 hover:opacity-95 text-white dark:bg-sky-400 dark:bg-none dark:hover:bg-sky-300 dark:text-zinc-950 px-6 py-3 rounded-xl font-bold text-sm transition"
            >
              Agendar o Primeiro Corte
            </Link>
          </div>
        ) : (
          <ClientAppointmentsList appointments={serialized} initialReviewId={feedbackAppointmentId} />
        )}
      </div>
    </main>
  );
}
