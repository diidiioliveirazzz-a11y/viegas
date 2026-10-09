import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "BARBER")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { date, startTime, endTime, reason } = await req.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: "Data e horas são obrigatórias" }, { status: 400 });
    }

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const block = await prisma.blockedTime.create({
      data: {
        date: selectedDate,
        startTime,
        endTime,
        reason: reason || null,
      },
    });

    return NextResponse.json({ success: true, block });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar bloqueio" }, { status: 500 });
  }
}
