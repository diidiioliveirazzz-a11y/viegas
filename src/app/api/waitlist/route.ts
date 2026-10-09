import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loyaltyTierForVisits } from "@/lib/loyalty";
import { getBookingWindowMessage, isDateWithinBookingWindow } from "@/lib/booking-window";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tens de iniciar sessão para entrar na lista de espera" }, { status: 401 });
  }

  try {
    const { date, timeSlot, serviceId, isDuo } = await req.json();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !serviceId) {
      return NextResponse.json({ error: "Data e serviço obrigatórios" }, { status: 400 });
    }

    const loyalty = await prisma.loyalty.findUnique({
      where: { userId: session.user.id },
      select: { visits: true },
    });
    const isVip = loyaltyTierForVisits(loyalty?.visits ?? 0) === "VIP";
    if (!isDateWithinBookingWindow(date, isVip)) {
      return NextResponse.json({ error: getBookingWindowMessage() }, { status: 400 });
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, isActive: true },
      select: { id: true },
    });
    if (!service) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    }
    const selectedDate = new Date(`${date}T00:00:00.000Z`);

    const existing = await prisma.waitlist.findFirst({
      where: {
        userId: session.user.id,
        date: selectedDate,
        serviceId,
        isDuo: isDuo === true,
        OR: [{ notified: false }, { offerExpiresAt: { gt: new Date() } }],
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Já estás na lista de espera para esta data." });
    }

    const entry = await prisma.waitlist.create({
      data: {
        userId: session.user.id,
        date: selectedDate,
        timeSlot: timeSlot || null,
        serviceId,
        isDuo: isDuo === true,
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("[POST /api/waitlist]", error);
    return NextResponse.json({ error: "Erro ao registar na lista de espera" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const entries = await prisma.waitlist.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      include: { service: { select: { name: true } } },
    });
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[GET /api/waitlist]", error);
    return NextResponse.json({ error: "Erro ao consultar a lista de espera" }, { status: 500 });
  }
}
