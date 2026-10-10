import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GalleryClient from "./GalleryClient";

export default async function GaleriaPage() {
  const session = await getServerSession(authOptions);
  const styles = await prisma.hairStyle.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="page-shell min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pb-24 transition-colors duration-300">
      {/* Navbar Superior Responsiva */}
      <Navbar user={session?.user} />

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-12">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-block mb-3 px-3.5 py-1.5 rounded-full border border-pink-200 bg-pink-50 text-pink-600 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-400 text-xs font-bold tracking-widest uppercase transition-colors">
            Portefólio
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">TRABALHOS DO DIOGO</h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Registos reais do dia a dia na Viegas Barber. Atendimento personalizado e cortes à medida de cada cliente.
          </p>
        </div>

        <GalleryClient styles={styles} />
      </div>
    </main>
  );
}
