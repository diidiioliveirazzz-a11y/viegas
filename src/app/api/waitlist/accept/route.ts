import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loyaltyTierForVisits } from "@/lib/loyalty";
import { getBookingWindowMessage, isDateWithinBookingWindow } from "@/lib/booking-window";

function minutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Inicia sessão para aceitar esta vaga." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : "";
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.waitlist.findFirst({
        where: { id, userId: session.user.id, notified: true, offerExpiresAt: { gt: now } },
        include: { service: true },
      });
      if (!entry || !entry.service || !entry.timeSlot) {
        throw new Error("Esta oferta já expirou ou não está disponível.");
      }

      const loyalty = await tx.loyalty.findUnique({
        where: { userId: session.user.id },
        select: { visits: true },
      });
      const isVip = loyaltyTierForVisits(loyalty?.visits ?? 0) === "VIP";
      const entryDate = entry.date.toISOString().slice(0, 10);
      if (!isDateWithinBookingWindow(entryDate, isVip, now)) {
        throw new Error("A oferta está fora da janela de marcações.");
      }

      const claimed = await tx.waitlist.updateMany({
        where: { id, userId: session.user.id, notified: true, offerExpiresAt: { gt: now } },
        data: { offerExpiresAt: null },
      });
      if (claimed.count !== 1) {
        throw new Error("Esta vaga já foi aceite por outra pessoa.");
      }

      const startMinutes = minutes(entry.timeSlot);
      const totalDuration = entry.service.duration * (entry.isDuo ? 2 : 1);
      const endMinutes = startMinutes + totalDuration;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
      const appointments = await tx.appointment.findMany({
        where: { date: entry.date, status: "SCHEDULED" },
        select: { startTime: true, endTime: true },
      });
      const blocks = await tx.blockedTime.findMany({
        where: { date: entry.date },
        select: { startTime: true, endTime: true },
      });
      if (
        appointments.some(
          (appointment) =>
            startMinutes < minutes(appointment.endTime) &&
            endMinutes > minutes(appointment.startTime)
        ) ||
        blocks.some(
          (block) =>
            startMinutes < minutes(block.endTime) &&
            endMinutes > minutes(block.startTime)
        )
      ) {
        throw new Error("Esta vaga acabou de ser reservada. Já não está disponível.");
      }

      const base = {
        userId: session.user.id,
        serviceId: entry.service.id,
        date: entry.date,
        status: "SCHEDULED",
      };
      if (!entry.isDuo) {
        const appointment = await tx.appointment.create({
          data: { ...base, startTime: entry.timeSlot, endTime },
        });
        await tx.notification.create({
          data: {
            userId: session.user.id,
            title: "Vaga Flash aceite! ✂️",
            message: `A tua marcação de ${entry.service.name} para ${entry.date.toLocaleDateString("pt-PT")} às ${entry.timeSlot} está confirmada.`,
            type: "BOOKING",
          },
        });
        return appointment;
      }

      const duoGroupId = crypto.randomUUID();
      const secondStartMinutes = startMinutes + entry.service.duration;
      const first = await tx.appointment.create({
        data: {
          ...base,
          startTime: entry.timeSlot,
          endTime: `${String(Math.floor(secondStartMinutes / 60)).padStart(2, "0")}:${String(secondStartMinutes % 60).padStart(2, "0")}`,
          duoGroupId,
        },
      });
      await tx.appointment.create({
        data: {
          ...base,
          startTime: `${String(Math.floor(secondStartMinutes / 60)).padStart(2, "0")}:${String(secondStartMinutes % 60).padStart(2, "0")}`,
          endTime,
          duoGroupId,
        },
      });
      await tx.notification.create({
        data: {
          userId: session.user.id,
          title: "Vaga Flash aceite! ✂️",
          message: `A tua marcação Duo de ${entry.service.name} para ${entry.date.toLocaleDateString("pt-PT")} às ${entry.timeSlot} está confirmada.`,
          type: "BOOKING",
        },
      });
      return first;
    });

    return NextResponse.json({ success: true, appointment: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("janela de marcações")) {
      return NextResponse.json({ error: getBookingWindowMessage() }, { status: 409 });
    }
    if (
      message.includes("expirou") ||
      message.includes("aceite") ||
      message.includes("reservada")
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    console.error("[POST /api/waitlist/accept]", error);
    return NextResponse.json({ error: "Não foi possível aceitar esta vaga." }, { status: 500 });
  }
}
