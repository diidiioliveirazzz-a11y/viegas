import { prisma } from "@/lib/prisma";
import BookingFlow from "./BookingFlow";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Suspense } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationsBell from "@/components/NotificationsBell";
import { loyaltyTierForVisits } from "@/lib/loyalty";

export default async function MarcarPage() {
  const session = await getServerSession(authOptions);

  // Fetch active services
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
  const loyalty = session?.user?.id
    ? await prisma.loyalty.findUnique({
        where: { userId: session.user.id },
        select: { visits: true },
      })
    : null;
  const isVip = loyaltyTierForVisits(loyalty?.visits ?? 0) === "VIP";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pb-20 transition-colors duration-300">
      <header className="p-6 max-w-5xl mx-auto flex justify-between items-center border-b border-slate-200 dark:border-zinc-900">
        <Link
          href="/"
          className="text-xl font-black tracking-tight hover:opacity-90 transition flex items-center gap-1"
        >
          <span>← VIEGAS</span>
          <span className="text-pink-600 dark:text-sky-400">.</span>
          <span>BARBER</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationsBell />

          {session ? (
            <span className="text-xs text-slate-600 dark:text-zinc-400">
              A marcar como:{" "}
              <strong className="text-pink-600 dark:text-sky-400 font-bold">
                {session.user?.name}
              </strong>
            </span>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition"
            >
              Já tens conta? Entrar
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-3">Nova Marcação</h1>
          <p className="text-slate-600 dark:text-zinc-400 text-sm">
            Sem intermediários: escolhe o teu serviço, dia e hora diretamente com o Diogo.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="text-center py-20 text-slate-400 dark:text-zinc-500">
              A carregar formulário de agendamento...
            </div>
          }
        >
          <BookingFlow services={services} initialUser={session?.user} isVip={isVip} />
        </Suspense>
      </div>
    </main>
  );
}
