import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SubscriptionClient from "./SubscriptionClient";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function PlanoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["PENDING_CASH", "ACTIVE"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900 dark:bg-black dark:text-white">
      <section className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/fidelizacao" className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            ← Fidelização
          </Link>
          <ThemeToggle />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Clube Viegas</p>
          <h1 className="text-4xl font-black">Plano mensal</h1>
          <p className="text-slate-600 dark:text-zinc-400">
            Dois cortes e duas barbas por mês por 40€. Pagamento presencial em numerário; o plano é ativado pelo Diogo após receber o pagamento.
          </p>
        </div>
        <div className="space-y-5 rounded-3xl border border-amber-500/30 bg-white p-8 shadow-xl dark:bg-zinc-900">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black">Plano Mensal</h2>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400">40€<span className="text-sm text-slate-500 dark:text-zinc-400"> / mês</span></p>
          </div>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-zinc-300">
            <li>✓ 2 cortes por mês</li>
            <li>✓ 2 serviços de barba por mês</li>
            <li>✓ Pagamento presencial em notas/moedas</li>
            <li>✓ Ativação depois de o pagamento ser confirmado na barbearia</li>
          </ul>
          {subscription?.status === "ACTIVE" && (
            <div className="space-y-1 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
              <p>Plano ativo até {subscription.endsAt?.toLocaleDateString("pt-PT")}.</p>
              <p>{subscription.cutsRemaining} cortes e {subscription.beardsRemaining} serviços de barba disponíveis este mês.</p>
            </div>
          )}
          <SubscriptionClient currentStatus={subscription?.status} />
          <p className="text-xs text-slate-500 dark:text-zinc-500">
            O site regista o pedido; não processa cobranças nem renova automaticamente.
          </p>
        </div>
      </section>
    </main>
  );
}
