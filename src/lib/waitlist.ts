import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function offerNextWaitlistEntry(date: Date, startTime: string) {
  const startMinutes = timeToMinutes(startTime);
  const slotDate = new Date(`${date.toISOString().slice(0, 10)}T${startTime}:00`);
  if (!Number.isFinite(slotDate.getTime()) || slotDate <= new Date()) return null;

  const settings = await getSettings();
  const closeMinutes = timeToMinutes(settings.closeTime);
  const lunchStart = timeToMinutes(settings.lunchStart);
  const lunchEnd = timeToMinutes(settings.lunchEnd);
  const tierPriority: Record<string, number> = { VIP: 0, Ouro: 1, Prata: 2, Bronze: 3 };

  return prisma.$transaction(async (tx) => {
    const activeOffer = await tx.waitlist.findFirst({
      where: { date, timeSlot: startTime, notified: true, offerExpiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (activeOffer) return null;

    const [appointments, blockedTimes, candidates] = await Promise.all([
      tx.appointment.findMany({
        where: { date, status: "SCHEDULED" },
        select: { startTime: true, endTime: true },
      }),
      tx.blockedTime.findMany({
        where: { date },
        select: { startTime: true, endTime: true },
      }),
      tx.waitlist.findMany({
        where: {
          date,
          notified: false,
          OR: [{ timeSlot: null }, { timeSlot: startTime }],
        },
        include: {
          service: { select: { id: true, name: true, duration: true } },
          user: { select: { loyalty: { select: { tier: true } } } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    candidates.sort((a, b) => {
      const aPriority = tierPriority[a.user.loyalty?.tier ?? "Bronze"] ?? 3;
      const bPriority = tierPriority[b.user.loyalty?.tier ?? "Bronze"] ?? 3;
      return aPriority - bPriority || a.createdAt.getTime() - b.createdAt.getTime();
    });

    for (const candidate of candidates) {
      if (!candidate.service) continue;
      const endMinutes = startMinutes + candidate.service.duration * (candidate.isDuo ? 2 : 1);
      const conflictsWithBooking = appointments.some(
        (appointment) =>
          startMinutes < timeToMinutes(appointment.endTime) &&
          endMinutes > timeToMinutes(appointment.startTime)
      );
      const conflictsWithBlock = blockedTimes.some(
        (block) =>
          startMinutes < timeToMinutes(block.endTime) &&
          endMinutes > timeToMinutes(block.startTime)
      );
      if (
        conflictsWithBooking ||
        conflictsWithBlock ||
        endMinutes > closeMinutes ||
        (startMinutes < lunchEnd && endMinutes > lunchStart)
      ) continue;

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const claimed = await tx.waitlist.updateMany({
        where: { id: candidate.id, notified: false },
        data: { notified: true, timeSlot: startTime, offerExpiresAt: expiresAt },
      });
      if (claimed.count !== 1) continue;

      await tx.notification.create({
        data: {
          userId: candidate.userId,
          title: "⚡ Vaga Flash disponível!",
          message: `Surgiu uma vaga para ${candidate.service.name} no dia ${date.toLocaleDateString("pt-PT")} às ${startTime}. Tens 10 minutos para a aceitar.`,
          type: "VACANCY",
          actionUrl: `/espera/${candidate.id}`,
        },
      });
      return candidate.id;
    }

    return null;
  });
}

export async function dispatchExpiredWaitlistOffers() {
  const expired = await prisma.waitlist.findMany({
    where: {
      notified: true,
      offerExpiresAt: { lte: new Date() },
      serviceId: { not: null },
    },
    select: { id: true, date: true, timeSlot: true },
  });

  const dispatchedSlots = new Set<string>();
  for (const offer of expired) {
    if (!offer.timeSlot) continue;
    const slotKey = `${offer.date.toISOString().slice(0, 10)}:${offer.timeSlot}`;
    if (dispatchedSlots.has(slotKey)) continue;
    dispatchedSlots.add(slotKey);
    await offerNextWaitlistEntry(offer.date, offer.timeSlot);
  }
}
