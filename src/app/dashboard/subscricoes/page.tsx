import { prisma } from "@/lib/prisma";
import SubscriptionList from "./SubscriptionList";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  const serialized = subscriptions.map((subscription) => ({
    ...subscription,
    createdAt: subscription.createdAt.toISOString(),
    endsAt: subscription.endsAt?.toISOString() ?? null,
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Subscrições mensais</h1>
        <p className="mt-1 text-sm text-zinc-400">Confirma o pagamento em numerário antes de ativar o plano.</p>
      </div>
      <SubscriptionList items={serialized} />
    </div>
  );
}
