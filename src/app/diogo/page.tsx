import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DiogoProfilePage() {
  const session = await getServerSession(authOptions);
  const reviews = await prisma.review.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      appointment: { include: { service: { select: { name: true } } } },
    },
  });

  const avgRatingResult = await prisma.review.aggregate({
    _avg: { rating: true },
    _count: { rating: true },
  });

  const avgRating = avgRatingResult._avg.rating ? avgRatingResult._avg.rating.toFixed(1) : "5.0";
  const totalReviews = avgRatingResult._count.rating || 0;

  const styles = await prisma.hairStyle.findMany({
    take: 6,
    orderBy: { likes: "desc" },
  });

  return (
    <main className="page-shell min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white transition-colors duration-300">
      {/* Navbar Superior Responsiva */}
      <Navbar user={session?.user} />

      {/* Hero Profile */}
      <section className="pt-36 pb-20 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          {/* Avatar / Photo */}
          <div className="md:col-span-5 relative flex justify-center">
            <div className="relative w-72 h-88 sm:w-80 sm:h-96 rounded-3xl overflow-hidden border-2 border-pink-200 dark:border-sky-400/30 shadow-2xl bg-black">
              <img
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"
                alt="Diogo Viegas"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center">
                <p className="text-xs text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-semibold">
                  Fundador & Master Barber
                </p>
                <p className="text-lg font-black text-pink-600 dark:text-sky-400">Diogo Viegas</p>
              </div>
            </div>
          </div>

          {/* Bio / Info */}
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-pink-200 bg-pink-50 text-pink-600 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-400 text-xs font-bold uppercase tracking-wider">
              <span>★ {avgRating} ({totalReviews} avaliações)</span>
              <span>•</span>
              <span>100% Satisfação</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              PRECISÃO, ESTILO E{" "}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-sky-500 bg-clip-text text-transparent dark:text-sky-400 dark:bg-none">
                EXCLUSIVIDADE.
              </span>
            </h1>

            <p className="text-slate-600 dark:text-zinc-300 text-lg leading-relaxed">
              Olá, sou o <strong className="text-slate-900 dark:text-white">Diogo Viegas</strong>. Criei a Viegas Barber para proporcionar mais do que um corte: uma experiência de relaxamento e estética contemporânea masculina de alto nível. Cada cliente tem a minha total atenção e dedicação personalizada.
            </p>

            {/* Especialidades */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3">
                Especialidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Degradês de Alta Precisão (Skin/Taper/Low Fade)",
                  "Barboterapia & Toalha Quente",
                  "Cortes Clássicos à Tesoura",
                  "Texturizados Urbanos (Crop/Mullet)",
                  "Consultoria Visagista de Rosto",
                ].map((esp, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 font-medium shadow-sm"
                  >
                    ✓ {esp}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                href="/marcar"
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 hover:opacity-95 text-white dark:bg-sky-400 dark:bg-none dark:hover:bg-sky-300 dark:text-zinc-950 px-8 py-4 rounded-xl font-bold text-center text-lg transition shadow-lg shadow-pink-500/20 dark:shadow-sky-400/20"
              >
                Marcar com o Diogo
              </Link>
              <Link
                href="/galeria"
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-white dark:border-zinc-800 px-6 py-4 rounded-xl font-semibold text-center transition shadow-sm"
              >
                Ver Portfólio Completo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Portfólio do Diogo */}
      <section className="py-20 bg-slate-100/60 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-pink-600 dark:text-sky-400 font-bold text-xs uppercase tracking-widest mb-1">
                Trabalhos Realizados
              </p>
              <h2 className="text-3xl md:text-4xl font-black">PORTFÓLIO EM DESTAQUE</h2>
            </div>
            <Link
              href="/galeria"
              className="text-sm font-semibold text-pink-600 dark:text-sky-400 hover:underline"
            >
              Ver Todos →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {styles.map((style) => (
              <div
                key={style.id}
                className="group rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm"
              >
                <div className="h-64 overflow-hidden relative bg-black/40">
                  <img
                    src={style.imageUrl}
                    alt={style.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-pink-600 dark:text-sky-400 border border-slate-200 dark:border-zinc-800">
                    {style.category}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1">{style.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mb-4">{style.description}</p>
                  <Link
                    href={`/marcar?ref=${encodeURIComponent(style.title)}`}
                    className="block text-center w-full py-2.5 rounded-lg text-xs font-bold transition bg-slate-100 hover:bg-gradient-to-r hover:from-purple-500 hover:via-pink-500 hover:to-sky-400 hover:text-white dark:bg-zinc-800 dark:hover:bg-sky-400 dark:hover:text-zinc-950"
                  >
                    Quero Este Corte
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avaliações do Diogo */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-2">Comentários de Clientes</h2>
          <p className="text-slate-500 dark:text-zinc-500 text-sm">O que diz quem confia no trabalho do Diogo</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.length > 0 ? (
            reviews.map((r) => (
              <div
                key={r.id}
                className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm"
              >
                <div className="text-pink-500 dark:text-sky-400 mb-2">{"★".repeat(r.rating)}</div>
                <p className="text-sm text-slate-700 dark:text-zinc-300 italic mb-4">
                  "{r.comment || "Excelente corte, pontual e muito profissional."}"
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold">
                  {r.user?.name || "Cliente Satisfeito"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 dark:text-zinc-500 col-span-3">
              Nenhum comentário registado de momento.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
