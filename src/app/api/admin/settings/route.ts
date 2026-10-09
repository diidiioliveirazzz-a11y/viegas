import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const settings = await prisma.setting.findUnique({
    where: { id: "default" },
  });
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "BARBER")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { minAdvanceHours, openTime, closeTime, lunchStart, lunchEnd, phone, address, shopName, barberName } = body;

    const updated = await prisma.setting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        minAdvanceHours: Number(minAdvanceHours) || 8,
        openTime: openTime || "09:00",
        closeTime: closeTime || "19:00",
        lunchStart: lunchStart || "13:00",
        lunchEnd: lunchEnd || "14:00",
        phone: phone || "+351 912 345 678",
        address: address || "Rua Principal, Lisboa",
        shopName: shopName || "Viegas Barber",
        barberName: barberName || "Diogo Viegas",
      },
      update: {
        minAdvanceHours: Number(minAdvanceHours),
        openTime,
        closeTime,
        lunchStart,
        lunchEnd,
        phone,
        address,
        shopName,
        barberName,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 });
  }
}
