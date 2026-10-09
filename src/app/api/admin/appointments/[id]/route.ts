import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { offerNextWaitlistEntry } from "@/lib/waitlist";
import { loyaltyTierForVisits } from "@/lib/loyalty";

const VALID_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
type AppointmentStatus = (typeof VALID_STATUSES)[number];

async function authorize() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "BARBER") return null;
  return session;
}

async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const outcome = await prisma.$transaction(async (tx) => {
    const current = await tx.appointment.findUnique({
      where: { id },
      include: { service: { select: { name: true } } },
    });
    if (!current) throw new Error("Marcação não encontrada");

    const appointment = await tx.appointment.update({
      where: { id },
      data: {
        status,
        reviewAvailableAt: status === "COMPLETED" && current.status !== "COMPLETED"
          ? new Date(Date.now() + 24 * 60 * 60 * 1000)
          : status !== "COMPLETED"
            ? null
            : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true, price: true } },
      },
    });

    let newlyCompleted = false;
    if (status === "COMPLETED" && !current.loyaltyAwarded) {
      const loyalty = await tx.loyalty.findUnique({ where: { userId: current.userId } });
      const visits = (loyalty?.visits ?? 0) + 1;
      await tx.appointment.update({
        where: { id },
        data: { loyaltyAwarded: true },
      });
      await tx.loyalty.upsert({
        where: { userId: current.userId },
        create: { userId: current.userId, points: 15, visits, tier: loyaltyTierForVisits(visits) },
        update: {
          points: { increment: 15 },
          visits: { increment: 1 },
          tier: loyaltyTierForVisits(visits),
        },
      });
      newlyCompleted = true;
    }
    if (
      status === "CANCELLED" &&
      current.status === "SCHEDULED" &&
      current.subscriptionId &&
      !current.subscriptionCreditRestored
    ) {
      const serviceName = current.service.name.toLocaleLowerCase("pt-PT");
      const isBeardService = serviceName.includes("barba");
      const isHaircutService = /corte|cabelo|fade|buzz|tesoura/.test(serviceName);
      await tx.subscription.update({
        where: { id: current.subscriptionId },
        data: {
          ...(isBeardService && { beardsRemaining: { increment: 1 } }),
          ...(isHaircutService && { cutsRemaining: { increment: 1 } }),
        },
      });
      await tx.appointment.update({
        where: { id },
        data: { subscriptionCreditRestored: true },
      });
    }

    return {
      appointment,
      newlyCompleted,
      newlyCancelled: current.status !== "CANCELLED" && status === "CANCELLED",
    };
  });

  if (outcome.newlyCompleted) {
    await prisma.notification.create({
      data: {
        userId: outcome.appointment.user.id,
        title: "O teu corte foi concluído!",
        message: "Daqui a 24 horas receberás um convite para partilhar feedback privado sobre o teu corte.",
        type: "LOYALTY",
      },
    });
  }
  if (outcome.newlyCancelled) {
    await offerNextWaitlistEntry(outcome.appointment.date, outcome.appointment.startTime);
  }
  return outcome.appointment;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authorize();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const { status } = body as { status: AppointmentStatus };

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const appointment = await updateAppointmentStatus(id, status);
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("[PATCH /api/admin/appointments/[id]]", error);
    if (error instanceof Error && error.message === "Marcação não encontrada") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao atualizar marcação" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authorize();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await ctx.params;

    await updateAppointmentStatus(id, "CANCELLED");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/appointments/[id]]", error);
    if (error instanceof Error && error.message === "Marcação não encontrada") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao cancelar marcação" }, { status: 500 });
  }
}
