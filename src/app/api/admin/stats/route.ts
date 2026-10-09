import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "BARBER") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const now = new Date();

    // Today boundaries
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // This week boundaries (Mon–Sun)
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // This month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      todayCount,
      weekCount,
      monthAppointments,
      totalClients,
      allAppointments,
      avgRating,
    ] = await Promise.all([
      prisma.appointment.count({
        where: { date: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.appointment.count({
        where: { date: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.appointment.findMany({
        where: {
          date: { gte: monthStart, lte: monthEnd },
          status: { in: ["SCHEDULED", "COMPLETED"] },
        },
        include: { service: { select: { price: true } } },
      }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.appointment.findMany({
        select: { status: true, serviceId: true, service: { select: { name: true } } },
      }),
      prisma.review.aggregate({ _avg: { rating: true } }),
    ]);

    // Estimated monthly revenue
    const monthRevenue = monthAppointments.reduce(
      (sum, a) => sum + (a.service?.price ?? 0),
      0
    );

    // Count by status
    const countByStatus: Record<string, number> = {};
    for (const a of allAppointments) {
      countByStatus[a.status] = (countByStatus[a.status] ?? 0) + 1;
    }

    // Most requested service
    const serviceCount: Record<string, { name: string; count: number }> = {};
    for (const a of allAppointments) {
      if (!serviceCount[a.serviceId]) {
        serviceCount[a.serviceId] = { name: a.service.name, count: 0 };
      }
      serviceCount[a.serviceId].count++;
    }
    const topService = Object.values(serviceCount).sort((a, b) => b.count - a.count)[0] ?? null;

    return NextResponse.json({
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthAppointments.length,
      monthRevenue: parseFloat(monthRevenue.toFixed(2)),
      totalClients,
      topService,
      avgRating: avgRating._avg.rating
        ? parseFloat(avgRating._avg.rating.toFixed(1))
        : null,
      countByStatus,
    });
  } catch (error) {
    console.error("[GET /api/admin/stats]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
