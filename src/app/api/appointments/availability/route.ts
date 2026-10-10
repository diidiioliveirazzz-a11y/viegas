import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { authOptions } from "@/lib/auth";
import { loyaltyTierForVisits } from "@/lib/loyalty";
import { getBookingWindowMessage, isDateWithinBookingWindow } from "@/lib/booking-window";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");
  const isDuo = searchParams.get("duo") === "true";

  if (!dateStr || !serviceId) {
    return NextResponse.json({ error: "Data e serviço são obrigatórios" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const loyalty = session?.user?.id
      ? await prisma.loyalty.findUnique({
          where: { userId: session.user.id },
          select: { visits: true },
        })
      : null;
    const isVip = loyaltyTierForVisits(loyalty?.visits ?? 0) === "VIP";

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }
    if (!isDateWithinBookingWindow(dateStr, isVip)) {
      return NextResponse.json({ error: getBookingWindowMessage() }, { status: 400 });
    }

    const settings = await getSettings();

    const [openH, openM] = settings.openTime.split(":").map(Number);
    const [closeH, closeM] = settings.closeTime.split(":").map(Number);
    const [lunchStartH, lunchStartM] = settings.lunchStart.split(":").map(Number);
    const [lunchEndH, lunchEndM] = settings.lunchEnd.split(":").map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    const lunchStartMinutes = lunchStartH * 60 + lunchStartM;
    const lunchEndMinutes = lunchEndH * 60 + lunchEndM;

    const selectedDate = new Date(`${dateStr}T00:00:00.000Z`);

    const now = new Date();
    const minAdvanceMs = (settings.minAdvanceHours || 8) * 60 * 60 * 1000;
    const earliestAllowedTime = new Date(now.getTime() + minAdvanceMs);

    // Marcações existentes para este dia
    const appointments = await prisma.appointment.findMany({
      where: {
        date: selectedDate,
        status: "SCHEDULED",
      },
    });

    // Bloqueios de horário
    const blockedTimes = await prisma.blockedTime.findMany({
      where: { date: selectedDate },
    });

    const availableSlots: string[] = [];
    const serviceDuration = 50 * (isDuo ? 2 : 1);

    const checkAndPushSlot = (currentMins: number) => {
      const slotEndMins = currentMins + serviceDuration;

      // Ignora se colidir com o almoço
      if (currentMins < lunchEndMinutes && slotEndMins > lunchStartMinutes) {
        return;
      }

      const h = Math.floor(currentMins / 60);
      const m = currentMins % 60;
      const slotStartStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      // Validação da antecedência mínima
      const slotDateObj = new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
      if (slotDateObj < earliestAllowedTime) {
        return;
      }

      let isAvailable = true;

      // Verificar conflitos com marcações existentes
      for (const app of appointments) {
        const [appStartH, appStartM] = app.startTime.split(":").map(Number);
        const [appEndH, appEndM] = app.endTime.split(":").map(Number);
        const appStartMins = appStartH * 60 + appStartM;
        const appEndMins = appEndH * 60 + appEndM;

        if (currentMins < appEndMins && slotEndMins > appStartMins) {
          isAvailable = false;
          break;
        }
      }

      // Verificar bloqueios manuais de horários/folgas
      if (isAvailable) {
        for (const block of blockedTimes) {
          const [bStartH, bStartM] = block.startTime.split(":").map(Number);
          const [bEndH, bEndM] = block.endTime.split(":").map(Number);
          const bStartMins = bStartH * 60 + bStartM;
          const bEndMins = bEndH * 60 + bEndM;

          if (currentMins < bEndMins && slotEndMins > bStartMins) {
            isAvailable = false;
            break;
          }
        }
      }

      if (isAvailable) {
        availableSlots.push(slotStartStr);
      }
    };

    // Vagas de 50 em 50 minutos:
    // Bloco da manhã: 09:00, 09:50, 10:40, 11:30
    const morningEnd = closeMinutes > lunchEndMinutes ? lunchStartMinutes : closeMinutes;
    for (let currentMins = openMinutes; currentMins + serviceDuration <= morningEnd; currentMins += 50) {
      checkAndPushSlot(currentMins);
    }

    // Bloco da tarde: recomeça após o almoço (13:30, 14:20, 15:10, 16:00, 16:50, 17:40)
    if (closeMinutes > lunchEndMinutes) {
      for (let currentMins = lunchEndMinutes; currentMins + serviceDuration <= closeMinutes; currentMins += 50) {
        checkAndPushSlot(currentMins);
      }
    }

    return NextResponse.json({
      availableTimes: availableSlots,
      minAdvanceHours: settings.minAdvanceHours,
    });
  } catch (error) {
    console.error("[GET /api/appointments/availability]", error);
    return NextResponse.json({ error: "Erro interno ao calcular horários" }, { status: 500 });
  }
}
