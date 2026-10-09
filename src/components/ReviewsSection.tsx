import { prisma } from "@/lib/prisma";

export default async function ReviewsSection() {
  const reviews = await prisma.review.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      appointment: { include: { service: { select: { name: true } } } },
    },
  });

  if (reviews.length === 0) {
    return (
      <section className="bg-slate-50 dark:bg-black py-24 border-t border-slate-200 dark:border-zinc-900 transition-colors">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-block mb-3 px-3 py-1 rounded-full border border-pink-200 bg-pink-50 text-pink-600 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-400 text-xs font-bold tracking-widest uppercase">
            Experiência Real
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4">AVALIAÇÕES DOS CLIENTES</h2>
          <p className="text-slate-500 dark:text-zinc-500 max-w-lg mx-auto">
            Todas as avaliações são 100% verificadas e deixadas exclusivamente por clientes com cortes concluídos.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-50 dark:bg-black py-24 border-t border-slate-200 dark:border-zinc-900 transition-colors">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block mb-3 px-3 py-1 rounded-full border border-pink-200 bg-pink-50 text-pink-600 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-400 text-xs font-bold tracking-widest uppercase">
            Feedback Verificado
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">O QUE DIZEM DA VIEGAS BARBER</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 dark:bg-sky-400 rounded-full mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between hover:border-pink-300 dark:hover:border-sky-400/40 transition shadow-sm"
            >
              <div>
                <div className="flex gap-1 text-pink-500 dark:text-sky-400 mb-3 text-lg">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < r.rating ? "★" : "☆"}</span>
                  ))}
                </div>
                {r.comment && (
                  <p className="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed mb-4 italic">
                    "{r.comment}"
                  </p>
                )}
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex justify-between items-center text-xs text-slate-500 dark:text-zinc-500">
                <span className="font-bold text-slate-900 dark:text-white">
                  {r.user?.name ? r.user.name.split(" ")[0] : "Cliente"}
                </span>
                <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
                  {r.appointment?.service?.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
