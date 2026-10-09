import { prisma } from "@/lib/prisma";
import ServicosClient from "./ServicosClient";

export const dynamic = "force-dynamic";

export default async function ServicosPage() {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Serialize for client
  const serialized = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    price: s.price,
    duration: s.duration,
    isActive: s.isActive,
  }));

  return <ServicosClient initialServices={serialized} />;
}
