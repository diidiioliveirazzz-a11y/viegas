import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardSignOutButton from "@/components/DashboardSignOutButton";

const navLinks = [
  { href: "/dashboard", label: "Agenda Hoje", emoji: "📅" },
  { href: "/dashboard/agenda", label: "Agenda Completa", emoji: "🗓️" },
  { href: "/dashboard/clientes", label: "Clientes", emoji: "🧑" },
  { href: "/dashboard/compras", label: "Reservas da Loja", emoji: "🛍️" },
  { href: "/dashboard/catalogo", label: "Catálogo & Stock", emoji: "📦" },
  { href: "/dashboard/subscricoes", label: "Subscrições", emoji: "💳" },
  { href: "/dashboard/servicos", label: "Serviços & Preços", emoji: "✂️" },
  { href: "/dashboard/heatmap", label: "Mapa de Horários", emoji: "🔥" },
  { href: "/dashboard/definicoes", label: "Definições da Barbearia", emoji: "⚙️" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "BARBER") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-50">
        <Link href="/" className="font-black text-red-500 text-lg">
          ✂️ VIEGAS BARBER
        </Link>
        <div className="flex gap-2">
          <Link href="/" className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300">
            Ver Site
          </Link>
          <DashboardSignOutButton className="text-xs bg-red-600/15 border border-red-500/30 px-3 py-1.5 rounded-lg text-red-300" />
        </div>
      </div>

      {/* Mobile Horizontal Navigation */}
      <div className="md:hidden flex overflow-x-auto gap-2 p-3 bg-zinc-900/60 border-b border-zinc-800 scrollbar-none sticky top-14 z-40">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-xs font-semibold whitespace-nowrap text-zinc-300 hover:text-red-400 hover:bg-zinc-800 border border-zinc-800"
          >
            <span>{link.emoji}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-zinc-950 border-r border-zinc-900 flex-col justify-between">
        <div>
          <div className="px-6 py-6 border-b border-zinc-900 flex justify-between items-center">
            <div>
              <h1 className="text-red-500 font-black text-xl tracking-tight">
                ✂️ Viegas Barber
              </h1>
              <p className="text-zinc-500 text-xs mt-0.5">Área do Barbeiro</p>
            </div>
          </div>

          <nav className="px-3 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors font-medium text-sm"
              >
                <span className="text-lg leading-none">{link.emoji}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-900 space-y-3">
          <Link
            href="/"
            className="block text-center w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl border border-zinc-800"
          >
            ← Voltar ao Site Público
          </Link>

          <div>
            <p className="text-zinc-500 text-[11px]">Sessão iniciada como</p>
            <p className="text-white text-xs font-bold truncate">
              {session.user.name ?? session.user.email}
            </p>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
              {session.user.role}
            </span>
          </div>
          <DashboardSignOutButton className="block w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-center text-xs font-semibold text-red-300 hover:bg-red-500/20" />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-zinc-950 pb-16">
        {children}
      </main>
    </div>
  );
}
