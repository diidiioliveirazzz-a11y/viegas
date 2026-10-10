import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loyaltyTierForVisits } from "@/lib/loyalty";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationsBell from "@/components/NotificationsBell";

export default async function FidelizacaoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Obter fidelização do utilizador
  const loyalty = await prisma.loyalty.findUnique({
    where: { userId: session.user.id },
  });

  const rewards = await prisma.reward.findMany({
    where: { isActive: true },
    orderBy: { pointsCost: "asc" },
  });

  const points = loyalty?.points || 0;
  const visits = loyalty?.visits || 0;
  const tier = loyaltyTierForVisits(visits);
  const nextTier = visits < 5 ? "Prata" : visits < 12 ? "Ouro" : visits < 25 ? "VIP" : null;
  const visitsForNextTier = visits < 5 ? 5 : visits < 12 ? 12 : 25;

  // Próxima recompensa
  const nextReward = rewards.find((r) => r.pointsCost > points) || rewards[rewards.length - 1];
  const maxPoints = nextReward ? nextReward.pointsCost : 100;
  const progressPercent = Math.min(100, Math.round((points / maxPoints) * 100));

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900 dark:bg-zinc-950 dark:text-white">
      {/* Header */}
      <header className="p-6 max-w-5xl mx-auto flex justify-between items-center border-b border-zinc-900">
        <Link href="/" className="text-xl font-black tracking-tight text-slate-900 hover:text-amber-500 transition dark:text-white">
          ← VIEGAS<span className="text-amber-500">.</span>BARBER
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationsBell />
          <Link
            href="/marcar"
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            Marcar Corte (+15 pts)
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <div className="inline-block mb-3 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs font-bold tracking-widest uppercase">
            Clube Viegas Barber
          </div>
          <h1 className="text-4xl font-black mb-2">O TEU PROGRAMA DE FIDELIZAÇÃO</h1>
          <p className="text-sm text-zinc-400">
            Cada corte concluído e cada avaliação garantem pontos que podes trocar por descontos e serviços gratuitos.
          </p>
        </div>

        {/* Card do Cliente */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/30 p-8 shadow-2xl mb-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-0"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-8">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Cartão de Membro</p>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{session.user.name}</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-black">
                    Nível {tier}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-zinc-400">Saldo Atual</p>
              <p className="text-5xl font-black text-amber-500">{points} <span className="text-lg text-zinc-300">pts</span></p>
              <p className="text-xs text-zinc-500 mt-1">{visits} visitas concluídas</p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-amber-500/20 bg-white p-5 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold">Níveis do Clube</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                  {nextTier ? `Faltam ${visitsForNextTier - visits} visitas para chegares a ${nextTier}.` : "Atingiste o nível máximo — VIP."}
                </p>
              </div>
              <Link href="/plano" className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-amber-400">
                Ver plano mensal
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {[
                ["Bronze", "0 visitas", "15 pontos por corte"],
                ["Prata", "5 visitas", "Recompensas exclusivas"],
                ["Ouro", "12 visitas", "Lavagem premium grátis"],
                ["VIP", "25 visitas", "Acesso à agenda 24h antes e prioridade nas vagas Flash"],
              ].map(([name, threshold, benefit]) => (
                <div key={name} className={`rounded-xl border p-3 ${tier === name ? "border-amber-500 bg-amber-500/10" : "border-slate-200 dark:border-zinc-800"}`}>
                  <p className="font-bold text-amber-600 dark:text-amber-400">{name}</p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">{threshold}</p>
                  <p className="mt-2 text-xs text-slate-700 dark:text-zinc-300">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-400 font-semibold">
              <span>Próxima Recompensa: {nextReward ? nextReward.title : "Objetivo Máximo atingido!"}</span>
              <span>{points} / {maxPoints} pts</span>
            </div>
            <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Recompensas Disponíveis */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black">Recompensas para Resgatar</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const canRedeem = points >= reward.pointsCost;
              return (
                <div
                  key={reward.id}
                  className={`p-6 rounded-2xl border transition flex flex-col justify-between ${
                    canRedeem
                      ? "bg-zinc-900 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                      : "bg-zinc-900/40 border-zinc-800/80 opacity-75"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-2xl">🎁</span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-800 text-amber-400 border border-zinc-700">
                        {reward.pointsCost} pts
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">{reward.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-6">{reward.description}</p>
                  </div>

                  <button
                    disabled={!canRedeem}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition ${
                      canRedeem
                        ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    {canRedeem ? "Resgatar no Próximo Corte" : `Faltam ${reward.pointsCost - points} pts`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
