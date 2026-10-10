import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import HairHistoryClient from "./HairHistoryClient";
import NotificationsBell from "@/components/NotificationsBell";
import ThemeToggle from "@/components/ThemeToggle";

export default async function MeusCortesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const history = await prisma.clientHairHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  const serialized = history.map((h) => ({
    id: h.id,
    date: h.date.toISOString(),
    serviceName: h.serviceName,
    style: h.style,
    photoUrl: h.photoUrl,
    notes: h.notes,
  }));

  return (
    <main className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <header className="p-6 max-w-5xl mx-auto flex justify-between items-center border-b border-zinc-900">
        <Link href="/" className="text-xl font-black tracking-tight text-white hover:text-amber-500 transition">
          ← VIEGAS<span className="text-amber-500">.</span>BARBER
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationsBell />
          <Link
            href="/marcar"
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            Marcar Corte
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <HairHistoryClient items={serialized} />
      </div>
    </main>
  );
}
