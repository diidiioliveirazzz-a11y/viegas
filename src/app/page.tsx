import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ReviewsSection from "@/components/ReviewsSection";
import VirtualAssistant from "@/components/VirtualAssistant";
import Navbar from "@/components/Navbar";
import HeroBackground from "@/components/HeroBackground";
import FlashDropBanner from "@/components/FlashDropBanner";
import BarberBeatMachine from "@/components/BarberBeatMachine";

export default async function Home() {
  const session = await getServerSession(authOptions);

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  const featuredStyles = await prisma.hairStyle.findMany({
    take: 8,
    orderBy: { likes: "desc" },
  });

  const featuredProducts = await prisma.product.findMany({
    take: 3,
  });

  const setting = await prisma.setting.findUnique({
    where: { id: "default" },
  });

  return (
    <main className="page-shell min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white transition-colors duration-300">
      {/* Navbar Superior Responsiva com Tema e Animação */}
      <Navbar user={session?.user} />

      {/* Hero Section */}
      <section className="hero-section relative isolate min-h-[760px] overflow-hidden pt-40 pb-28 sm:min-h-[820px]">
        <HeroBackground
          images={featuredStyles
            .filter((style): style is typeof style & { imageUrl: string } => Boolean(style.imageUrl))
            .map((style) => ({
              id: style.id,
              title: style.title,
              imageUrl: style.imageUrl,
            }))}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <div className="hero-eyebrow inline-block mb-5 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-colors">
            Barbeiro Exclusivo: Diogo Viegas
          </div>

          <h1 className="hero-title text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
            VIEGAS BARBER
          </h1>

          <p className="text-2xl md:text-3xl font-extrabold tracking-wide mb-6 text-red-600 dark:text-red-400">
            “Mais que um corte.”
          </p>

          <p className="hero-description max-w-2xl mx-auto mb-10 text-base leading-relaxed md:text-lg">
            Atendimento individual, degradês milimétricos e um ambiente desenhado para o teu momento. Sem esperas desnecessárias, com marcação rápida e precisa.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/marcar"
              className="brand-button px-8 py-4 rounded-xl font-bold text-base transition shadow-xl"
            >
              MARCAR AGORA
            </Link>
          </div>

          {/* Flash Drop de Vagas */}
          <FlashDropBanner />

          {/* Banner de Próxima Disponibilidade & Antecedência */}
          <div className="hero-availability mt-6 max-w-xl mx-auto p-4 rounded-2xl flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Agenda aberta para os próximos dias</span>
            </div>
            <Link href="/marcar" className="font-bold text-red-600 hover:underline dark:text-red-400">
              Ver vagas livres →
            </Link>
          </div>

          {/* Radar de Vagas em Tempo Real */}
          <div className="radar-box mt-3 max-w-xl mx-auto text-left shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="radar-ping-dot"></span>
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Radar de Vagas em Tempo Real
                </span>
              </div>
              <span className="radar-badge-live">AO VIVO</span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {[0, 1, 2].map((offset) => {
                const d = new Date();
                d.setDate(d.getDate() + offset);
                const dayOfWeek = d.getDay();
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;
                const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                const label = offset === 0 ? "Hoje" : offset === 1 ? "Amanhã" : dayLabels[dayOfWeek];
                const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;

                return (
                  <Link
                    key={offset}
                    href="/marcar"
                    className="radar-day-card block p-2.5 rounded-xl transition"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-white">{label}</span>
                      <span className="text-[10px] text-zinc-400">{dateStr}</span>
                    </div>
                    <div className="text-[11px] font-semibold mb-0.5">
                      {isSunday ? (
                        <span className="text-red-400">🔴 Encerrado</span>
                      ) : (
                        <span className="text-emerald-400">🟢 Vagas livres</span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {isSunday ? "Folga semanal" : isSaturday ? "09:00 - 12:00" : "09:00 - 19:00"}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-between items-center text-[11px]">
              <span className="text-zinc-400">⚡ Atendimento individual sem esperas</span>
              <Link href="/marcar" className="font-bold text-red-500 hover:text-red-400 transition">
                Escolher Horário →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Destaque Diogo Viegas */}
      <section className="py-20 bg-slate-100/60 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 grid md:grid-cols-12 gap-8 items-center shadow-sm">
            <div className="md:col-span-4 flex justify-center">
              <div className="w-56 h-72 rounded-2xl overflow-hidden border border-pink-200 dark:border-sky-400/40 shadow-md">
                <img
                  src="/img/diogo-viegas.jpg"
                  alt="Diogo Viegas"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
            <div className="md:col-span-8 space-y-4">
              <span className="text-xs font-bold text-pink-600 dark:text-sky-400 uppercase tracking-widest">
                O Teu Barbeiro
              </span>
              <h2 className="text-3xl md:text-4xl font-black">Conhece o Diogo Viegas</h2>
              <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
                Na Viegas Barber és atendido exclusivamente pelo Diogo. Sem rotação de cadeiras, sem surpresas no resultado.                 Foco total no detalhe, higiene rigorosa e técnicas modernas de fade e barboterapia.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/diogo"
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-xl text-xs font-bold transition"
                >
                  Ver Perfil e Trabalhos do Diogo
                </Link>
                <Link
                  href="/marcar"
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 hover:opacity-95 text-white dark:bg-sky-400 dark:bg-none dark:hover:bg-sky-300 dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Marcar com o Diogo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-28 max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <span className="text-pink-600 dark:text-sky-400 font-bold text-xs uppercase tracking-widest">
            Catálogo
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mt-1 mb-3">
            SERVIÇOS DE EXCELÊNCIA
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 dark:bg-sky-400 rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-pink-300 dark:hover:border-sky-400/50 transition flex flex-col justify-between shadow-sm group"
            >
              <div>
                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-sky-400 transition">
                  {service.name}
                </h3>
                <p className="text-slate-600 dark:text-zinc-400 text-sm mb-8 leading-relaxed min-h-[50px]">
                  {service.description}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex justify-between items-baseline">
                <div>
                  <span className="text-xs text-slate-500 dark:text-zinc-500 block">Preço</span>
                  <span className="text-3xl font-black text-pink-600 dark:text-sky-400">
                    {service.price.toFixed(2)}€
                  </span>
                </div>
                <span className="text-xs text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                  ⏱ ~{service.duration} min
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Destaque Galeria de Trabalhos */}
      <section className="py-24 bg-slate-100/60 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-pink-600 dark:text-sky-400 font-bold text-xs uppercase tracking-widest">
                Portefólio
              </span>
              <h2 className="text-3xl md:text-4xl font-black mt-1">TRABALHOS DO DIOGO</h2>
            </div>
            <Link
              href="/galeria"
              className="text-sm font-semibold text-pink-600 dark:text-sky-400 hover:underline"
            >
              Ver Mais Fotos →
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {featuredStyles.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 group shadow-sm"
              >
                <div className="h-72 overflow-hidden relative">
                  <img
                    src={s.imageUrl}
                    alt="Trabalho Diogo Viegas"
                    className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition duration-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/marcar"
              className="brand-button inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base shadow-lg transition"
            >
              MARCAR HORÁRIO
            </Link>
          </div>
        </div>
      </section>

      {/* Beat Machine da Barbearia */}
      <BarberBeatMachine />

      {/* Secção de Avaliações */}
      <ReviewsSection />

      {/* Fidelização Teaser */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-sky-400/10 dark:from-sky-400/10 dark:via-zinc-900 dark:to-zinc-900 border border-pink-200 dark:border-sky-400/30 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
          <div className="space-y-3 max-w-xl">
            <span className="text-pink-600 dark:text-sky-400 font-bold text-xs uppercase tracking-widest">
              Programa de Fidelização
            </span>
            <h2 className="text-3xl md:text-4xl font-black">Ganhas pontos a cada visita</h2>
            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Acumula visitas na Viegas Barber e troca por serviços de barba grátis, cortes de cabelo de oferta e descontos exclusivos em ceras e pomadas.
            </p>
          </div>
          <Link
            href="/fidelizacao"
            className="whitespace-nowrap px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400 text-white dark:bg-sky-400 dark:bg-none dark:hover:bg-sky-300 dark:text-zinc-950 font-bold text-sm rounded-xl transition shadow-lg shadow-pink-500/20 dark:shadow-sky-400/20"
          >
            Ver o Meu Cartão de Pontos
          </Link>
        </div>
      </section>

      {/* Loja Teaser */}
      <section className="py-20 bg-slate-100/60 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-pink-600 dark:text-sky-400 font-bold text-xs uppercase tracking-widest">
                Produtos Profissionais
              </span>
              <h2 className="text-3xl md:text-4xl font-black mt-1">LOJA VIEGAS BARBER</h2>
            </div>
            <Link
              href="/loja"
              className="text-sm font-semibold text-pink-600 dark:text-sky-400 hover:underline"
            >
              Visitar Loja →
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {featuredProducts.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="h-44 rounded-xl overflow-hidden mb-4 bg-slate-100 dark:bg-zinc-950">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">{p.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 mb-4">{p.description}</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-xl font-black text-pink-600 dark:text-sky-400">{p.price.toFixed(2)}€</span>
                  <Link href="/loja" className="text-xs font-bold text-slate-700 hover:text-pink-600 dark:text-zinc-300 dark:hover:text-sky-400">
                    Comprar →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Localização e Contactos */}
      <footer className="bg-white dark:bg-black py-16 border-t border-slate-200 dark:border-zinc-900 text-slate-600 dark:text-zinc-400 text-xs transition-colors">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-3">
            <h3 className="text-slate-900 dark:text-white font-black text-lg">
              VIEGAS<span className="text-pink-600 dark:text-sky-400">.</span>BARBER
            </h3>
            <p className="text-slate-500 dark:text-zinc-500">
              Barbearia contemporânea e de alta precisão em Lisboa.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-slate-900 dark:text-white font-bold text-sm">Localização</h4>
            <p>{setting?.address || "Rua Principal, Lisboa"}</p>
            <p>Portugal</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-slate-900 dark:text-white font-bold text-sm">Horário</h4>
            <p>Segunda a Sábado</p>
            <p>{setting?.openTime || "09:00"} — {setting?.closeTime || "19:00"}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-slate-900 dark:text-white font-bold text-sm">Contacto</h4>
            <p>{setting?.phone || "+351 939 504 261"}</p>
            <p className="text-pink-600 dark:text-sky-400 font-bold">Instagram: @viegas_barber</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-8 border-t border-slate-100 dark:border-zinc-900 flex justify-between items-center text-slate-400 dark:text-zinc-600">
          <p>© {new Date().getFullYear()} Viegas Barber. Todos os direitos reservados.</p>
          <p>Feito para utilização real diária.</p>
        </div>
      </footer>

      {/* Assistente Virtual Flutuante */}
      <VirtualAssistant />
    </main>
  );
}
