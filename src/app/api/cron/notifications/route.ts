import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchExpiredWaitlistOffers } from "@/lib/waitlist";

function appointmentDate(date: Date, time: string) {
  return new Date(`${date.toISOString().slice(0, 10)}T${time}:00`);
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[GET /api/cron/notifications] CRON_SECRET não está configurado.");
    return NextResponse.json({ error: "Agendamento automático não configurado." }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const now = new Date();
    const completed = await prisma.appointment.findMany({
      where: {
        status: "COMPLETED",
        reviewAvailableAt: { lte: now },
        review: null,
      },
      select: { id: true, userId: true, service: { select: { name: true } }, date: true, startTime: true },
    });
    for (const appointment of completed) {
      await prisma.notification.upsert({
        where: { dedupeKey: `feedback:${appointment.id}` },
        create: {
          userId: appointment.userId,
          title: "Como ficou o teu corte?",
          message: "Deixa duas notas privadas para o Diogo se lembrar das tuas preferências no próximo corte.",
          type: "LOYALTY",
          actionUrl: `/minhas-marcacoes?feedback=${appointment.id}`,
          dedupeKey: `feedback:${appointment.id}`,
        },
        update: {},
      });
    }

    const recentAppointments = await prisma.appointment.findMany({
      where: {
        status: "COMPLETED",
        date: { gte: new Date(now.getTime() - 240 * 24 * 60 * 60 * 1000) },
      },
      orderBy: [{ userId: "asc" }, { date: "asc" }, { startTime: "asc" }],
      select: { id: true, userId: true, date: true, startTime: true, duoGroupId: true },
    });
    const visitsByUser = new Map<string, typeof recentAppointments>();
    const seenVisitKeys = new Set<string>();
    for (const appointment of recentAppointments) {
      const visitKey = `${appointment.userId}:${appointment.duoGroupId ?? appointment.id}`;
      if (seenVisitKeys.has(visitKey)) continue;
      seenVisitKeys.add(visitKey);
      const visits = visitsByUser.get(appointment.userId) ?? [];
      visits.push(appointment);
      visitsByUser.set(appointment.userId, visits);
    }

    let growthReminders = 0;
    for (const [userId, visits] of visitsByUser) {
      if (visits.length < 2) continue;
      const intervals = visits.slice(1).map((visit, index) =>
        (appointmentDate(visit.date, visit.startTime).getTime() -
          appointmentDate(visits[index].date, visits[index].startTime).getTime()) /
        (24 * 60 * 60 * 1000)
      );
      const averageDays = intervals.reduce((sum, days) => sum + days, 0) / intervals.length;
      const latest = visits[visits.length - 1];
      const expectedDate = appointmentDate(latest.date, latest.startTime).getTime() + averageDays * 24 * 60 * 60 * 1000;
      const reminderWindowStart = expectedDate - 24 * 60 * 60 * 1000;
      const reminderWindowEnd = expectedDate + 48 * 60 * 60 * 1000;
      if (now.getTime() < reminderWindowStart || now.getTime() > reminderWindowEnd) continue;

      await prisma.notification.upsert({
        where: { dedupeKey: `growth:${userId}:${latest.id}` },
        create: {
          userId,
          title: "O teu próximo corte está a chegar ✂️",
          message: `Já passaram cerca de ${Math.round(averageDays)} dias desde o teu último corte. Vê os horários disponíveis com o Diogo.`,
          type: "LOYALTY",
          actionUrl: "/marcar",
          dedupeKey: `growth:${userId}:${latest.id}`,
        },
        update: {},
      });
      growthReminders++;
    }

    const expiredSubscriptions = await prisma.subscription.findMany({
      where: { status: "ACTIVE", endsAt: { lte: now } },
      select: { id: true, userId: true },
    });
    for (const subscription of expiredSubscriptions) {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "EXPIRED" },
        }),
        prisma.user.update({
          where: { id: subscription.userId },
          data: { hasSubscription: false, subscriptionEndsAt: null },
        }),
      ]);
    }

    await dispatchExpiredWaitlistOffers();

    return NextResponse.json({
      feedbackReminders: completed.length,
      growthReminders,
      expiredSubscriptions: expiredSubscriptions.length,
    });
  } catch (error) {
    console.error("[GET /api/cron/notifications]", error);
    return NextResponse.json({ error: "Erro ao processar notificações agendadas." }, { status: 500 });
  }
}
