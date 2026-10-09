import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { getSettings } from "@/lib/settings";
import { randomUUID } from "crypto";
import { loyaltyTierForVisits } from "@/lib/loyalty";
import { getBookingWindowMessage, isDateWithinBookingWindow } from "@/lib/booking-window";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const serviceId = body.serviceId;
    const date = body.date;
    const startTime = body.startTime;
    const isDuo = body.isDuo === true;
    const companionName =
      typeof body.companionName === "string" ? body.companionName.trim().slice(0, 100) : "";
    const styleRef = body.styleRef || body.styleReference;
    const isSilent = body.isSilent === true;
    const musicRequest =
      typeof body.musicRequest === "string" ? body.musicRequest.trim().slice(0, 160) : "";
    const clientName = body.clientName || body.guestName || body.name || session?.user?.name;
    const clientEmail = body.clientEmail || body.guestEmail || body.email || session?.user?.email;
    const clientPhone = body.clientPhone || body.guestPhone || body.phone;

    if (!serviceId || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        typeof startTime !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
      return NextResponse.json({ error: "Serviço, data ou hora inválidos" }, { status: 400 });
    }
    if (isDuo && !companionName) {
      return NextResponse.json({ error: "Indica o nome da segunda pessoa para a marcação Duo." }, { status: 400 });
    }

    let targetUserId = session?.user?.id;
    const emailToUse = (session?.user?.email || clientEmail || "").toLowerCase().trim();

    if (!targetUserId && emailToUse) {
      const existing = await prisma.user.findUnique({ where: { email: emailToUse } });
      if (existing) targetUserId = existing.id;
    }

    if (!targetUserId) {
      if (!emailToUse || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
        return NextResponse.json(
          { error: "Por favor indica um email válido para confirmar a reserva." },
          { status: 400 }
        );
      }

      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      const newUser = await prisma.user.create({
        data: {
          name: clientName?.trim() || emailToUse.split("@")[0],
          email: emailToUse,
          phone: clientPhone?.trim() || null,
          password: randomPassword,
          role: "CLIENT",
        },
      });
      targetUserId = newUser.id;
    }
    if (!targetUserId) {
      return NextResponse.json({ error: "Não foi possível identificar o cliente." }, { status: 500 });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) {
      return NextResponse.json({ error: "Serviço não encontrado ou indisponível" }, { status: 404 });
    }

    const selectedDate = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(selectedDate.getTime())) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }
    const loyalty = session?.user?.id === targetUserId
      ? await prisma.loyalty.findUnique({
          where: { userId: targetUserId },
          select: { visits: true },
        })
      : null;
    const isVip = loyaltyTierForVisits(loyalty?.visits ?? 0) === "VIP";
    if (!isDateWithinBookingWindow(date, isVip)) {
      return NextResponse.json({ error: getBookingWindowMessage() }, { status: 400 });
    }

    const startParts = startTime.split(":").map(Number);
    const startMins = startParts[0] * 60 + startParts[1];
    const totalDuration = service.duration * (isDuo ? 2 : 1);
    const endMins = startMins + totalDuration;
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
    const settings = await getSettings();
    const openMinutes = Number(settings.openTime.slice(0, 2)) * 60 + Number(settings.openTime.slice(3));
    const closeMinutes = Number(settings.closeTime.slice(0, 2)) * 60 + Number(settings.closeTime.slice(3));
    const lunchStart = Number(settings.lunchStart.slice(0, 2)) * 60 + Number(settings.lunchStart.slice(3));
    const lunchEnd = Number(settings.lunchEnd.slice(0, 2)) * 60 + Number(settings.lunchEnd.slice(3));
    const localSlotDate = new Date(`${date}T${startTime}:00`);
    const earliestAllowed = Date.now() + settings.minAdvanceHours * 60 * 60 * 1000;

    if (
      !Number.isFinite(localSlotDate.getTime()) ||
      startMins < openMinutes ||
      endMins > closeMinutes ||
      (startMins < lunchEnd && endMins > lunchStart) ||
      localSlotDate.getTime() < earliestAllowed
    ) {
      return NextResponse.json({ error: "Este horário está fora do período de marcação disponível." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentLoyalty = session?.user?.id === targetUserId
        ? await tx.loyalty.findUnique({
            where: { userId: targetUserId },
            select: { visits: true },
          })
        : null;
      const currentlyVip = loyaltyTierForVisits(currentLoyalty?.visits ?? 0) === "VIP";
      if (!isDateWithinBookingWindow(date, currentlyVip)) {
        throw new Error("A data está fora da janela de marcações.");
      }

      const [allAppts, blockedTimes] = await Promise.all([
        tx.appointment.findMany({ where: { date: selectedDate, status: "SCHEDULED" } }),
        tx.blockedTime.findMany({ where: { date: selectedDate } }),
      ]);

      const conflictsWithAppointment = allAppts.some((app) => {
        const [aStartH, aStartM] = app.startTime.split(":").map(Number);
        const [aEndH, aEndM] = app.endTime.split(":").map(Number);
        const aStartMins = aStartH * 60 + aStartM;
        const aEndMins = aEndH * 60 + aEndM;
        return startMins < aEndMins && endMins > aStartMins;
      });

      const conflictsWithBlock = blockedTimes.some((block) => {
        const blockStart = block.startTime.split(":").map(Number);
        const blockEnd = block.endTime.split(":").map(Number);
        const blockStartMinutes = blockStart[0] * 60 + blockStart[1];
        const blockEndMinutes = blockEnd[0] * 60 + blockEnd[1];
        return startMins < blockEndMinutes && endMins > blockStartMinutes;
      });
      if (conflictsWithAppointment || conflictsWithBlock) {
        throw new Error("Este horário acabou de ser reservado por outro cliente. Por favor escolhe outra hora.");
      }

      let subscriptionId: string | null = null;
      if (session?.user?.id === targetUserId) {
        const serviceName = service.name.toLocaleLowerCase("pt-PT");
        const isBeardService = serviceName.includes("barba");
        const isHaircutService = /corte|cabelo|fade|buzz|tesoura/.test(serviceName);
        if (isBeardService || isHaircutService) {
          const subscription = await tx.subscription.findFirst({
            where: { userId: targetUserId, status: "ACTIVE", endsAt: { gt: new Date() } },
            orderBy: { endsAt: "desc" },
          });
          const creditsRequired = isDuo ? 2 : 1;
          const hasCredits =
            subscription &&
            (!isBeardService || subscription.beardsRemaining >= creditsRequired) &&
            (!isHaircutService || subscription.cutsRemaining >= creditsRequired);
          if (subscription && hasCredits) {
            const update = await tx.subscription.updateMany({
              where: isBeardService
                ? {
                    id: subscription.id,
                    ...(isHaircutService && { cutsRemaining: { gte: creditsRequired } }),
                    beardsRemaining: { gte: creditsRequired },
                    status: "ACTIVE",
                  }
                : { id: subscription.id, cutsRemaining: { gte: creditsRequired }, status: "ACTIVE" },
              data: {
                ...(isBeardService && { beardsRemaining: { decrement: creditsRequired } }),
                ...(isHaircutService && { cutsRemaining: { decrement: creditsRequired } }),
              },
            });
            if (update.count === 1) subscriptionId = subscription.id;
          }
        }
      }
      const base = {
        userId: targetUserId,
        serviceId: service.id,
        date: selectedDate,
        status: "SCHEDULED",
        styleRef: styleRef || null,
        isSilent,
        musicRequest: musicRequest || null,
        duoGroupId: isDuo ? randomUUID() : null,
        subscriptionId,
      };
      const first = await tx.appointment.create({
        data: {
          ...base,
          startTime,
          endTime: `${String(Math.floor((startMins + service.duration) / 60)).padStart(2, "0")}:${String((startMins + service.duration) % 60).padStart(2, "0")}`,
          companionName: isDuo ? companionName : null,
        },
      });
      if (!isDuo) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            title: "Marcação Confirmada! ✂️",
            message: `O teu corte (${service.name}) está confirmado para ${selectedDate.toLocaleDateString("pt-PT")} às ${startTime}. O Diogo estará à tua espera!`,
            type: "BOOKING",
          },
        });
        return { appointments: [first], subscriptionId };
      }

      const secondStartMins = startMins + service.duration;
      const second = await tx.appointment.create({
        data: {
          ...base,
          startTime: `${String(Math.floor(secondStartMins / 60)).padStart(2, "0")}:${String(secondStartMins % 60).padStart(2, "0")}`,
          endTime,
          companionName: clientName?.trim() || session?.user?.name || "Acompanhante",
        },
      });
      await tx.appointment.update({
        where: { id: first.id },
        data: { companionId: second.id },
      });
      await tx.appointment.update({
        where: { id: second.id },
        data: { companionId: first.id },
      });
      await tx.notification.create({
        data: {
          userId: targetUserId,
          title: "Marcação Duo Confirmada! ✂️",
          message: `Duas sessões de ${service.name} estão confirmadas para ${selectedDate.toLocaleDateString("pt-PT")} às ${startTime}. O Diogo estará à tua espera!`,
          type: "BOOKING",
        },
      });
      return { appointments: [first, second], subscriptionId };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message.includes("janela de marcações")) {
      return NextResponse.json({ error: getBookingWindowMessage() }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("acabou de ser reservado")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[POST /api/appointments]", error);
    return NextResponse.json({ error: "Erro ao efetuar marcação" }, { status: 500 });
  }
}
