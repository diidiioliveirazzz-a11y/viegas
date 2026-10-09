import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  await getServerSession(authOptions);

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: {
      appointments: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true, status: true },
      },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-white text-3xl font-bold">Clientes</h1>
        <p className="text-zinc-400 mt-1">{clients.length} clientes registados</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-zinc-400">Ainda não há clientes registados.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-400 text-xs uppercase tracking-widest px-6 py-3 font-medium">
                  Nome
                </th>
                <th className="text-left text-zinc-400 text-xs uppercase tracking-widest px-6 py-3 font-medium">
                  Email
                </th>
                <th className="text-left text-zinc-400 text-xs uppercase tracking-widest px-6 py-3 font-medium">
                  Marcações
                </th>
                <th className="text-left text-zinc-400 text-xs uppercase tracking-widest px-6 py-3 font-medium">
                  Última Visita
                </th>
                <th className="text-left text-zinc-400 text-xs uppercase tracking-widest px-6 py-3 font-medium">
                  Membro desde
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const lastVisit = client.appointments[0];
                return (
                  <tr
                    key={client.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-500 text-xs font-bold">
                            {(client.name ?? client.email ?? "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white font-medium">
                          {client.name ?? <span className="text-zinc-500 italic">Sem nome</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {client.email ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {client._count.appointments}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {lastVisit
                        ? new Date(lastVisit.date).toLocaleDateString("pt-PT")
                        : <span className="text-zinc-600">Nunca</span>}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-sm">
                      {new Date(client.createdAt).toLocaleDateString("pt-PT")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
