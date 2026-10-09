import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StoreClient from "./StoreClient";

export default async function LojaPage() {
  const session = await getServerSession(authOptions);
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="page-shell min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pb-24 transition-colors duration-300">
      {/* Navbar Superior Responsiva */}
      <Navbar user={session?.user} />

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-12">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <div className="inline-block mb-3 px-3.5 py-1.5 rounded-full border border-pink-200 bg-pink-50 text-pink-600 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-400 text-xs font-bold tracking-widest uppercase transition-colors">
            Cuidado Masculino
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">LOJA VIEGAS BARBER</h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Produtos profissionais selecionados e recomendados pessoalmente pelo Diogo para manteres o teu estilo impecável todos os dias.
          </p>
        </div>

        <StoreClient products={products} isSignedIn={Boolean(session?.user?.id)} />
      </div>
    </main>
  );
}
