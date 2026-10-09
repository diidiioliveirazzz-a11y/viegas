import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AcceptFlashOffer from "./AcceptFlashOffer";

export default async function FlashOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const offer = await prisma.waitlist.findFirst({
    where: { id, userId: session.user.id, notified: true },
    include: { service: { select: { name: true, duration: true } } },
  });
  if (!offer || !offer.service || !offer.timeSlot) notFound();

  const isAvailable = Boolean(offer.offerExpiresAt && offer.offerExpiresAt > new Date());
  const dateLabel = offer.date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 dark:bg-black dark:text-white">
      <section className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-5xl" aria-hidden="true">⚡</p>
        <h1 className="text-3xl font-black">Vaga Flash</h1>
        <p className="text-slate-600 dark:text-zinc-400">
          {isAvailable
            ? "Alguém cancelou. Esta vaga fica reservada para ti durante 10 minutos."
            : "O prazo para aceitar esta vaga terminou."}
        </p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-zinc-800 dark:bg-zinc-950">
          <p className="font-bold">{offer.isDuo ? `Duo · ${offer.service.name} + ${offer.service.name}` : offer.service.name}</p>
          <p className="mt-1 text-sm capitalize text-slate-600 dark:text-zinc-400">
            {dateLabel} às {offer.timeSlot} · {offer.service.duration * (offer.isDuo ? 2 : 1)} min
          </p>
          {isAvailable && offer.offerExpiresAt && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              Aceita até às {offer.offerExpiresAt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}.
            </p>
          )}
        </div>
        {isAvailable ? (
          <AcceptFlashOffer id={offer.id} />
        ) : (
          <Link
            href="/marcar"
            className="block rounded-xl bg-amber-500 px-6 py-3 font-bold text-zinc-950 transition hover:bg-amber-400"
          >
            Ver outros horários
          </Link>
        )}
      </section>
    </main>
  );
}
