import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function DefinicoesPage() {
  const session = await getServerSession(authOptions);
  const settings = await getSettings();

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-white text-3xl font-black">Definições da Barbearia</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Gere os teus horários, folgas, contactos e regras de reserva sem tocar em código.
        </p>
      </div>

      {/* Cartão da Conta */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-4xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Conta Ativa</span>
          <h3 className="text-lg font-bold text-white">{session?.user?.name}</h3>
          <p className="text-xs text-zinc-400">{session?.user?.email}</p>
        </div>
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold">
          {session?.user?.role} • Acesso Total
        </span>
      </div>

      <SettingsClient
        initialSettings={{
          id: settings.id,
          minAdvanceHours: settings.minAdvanceHours,
          openTime: settings.openTime,
          closeTime: settings.closeTime,
          lunchStart: settings.lunchStart,
          lunchEnd: settings.lunchEnd,
          phone: settings.phone,
          address: settings.address,
          shopName: settings.shopName,
          barberName: settings.barberName,
        }}
      />
    </div>
  );
}
