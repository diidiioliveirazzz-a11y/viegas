import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Lista avaliações públicas recentes
export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: { isPrivate: false },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, image: true } },
        appointment: { include: { service: { select: { name: true } } } },
      },
    });

    const formatted = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      userName: r.user?.name ? r.user.name.split(" ")[0] : "Cliente",
      serviceName: r.appointment?.service?.name || "Serviço",
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ reviews: formatted });
  } catch (error) {
    console.error("[GET /api/reviews]", error);
    return NextResponse.json({ error: "Erro ao procurar avaliações" }, { status: 500 });
  }
}

// POST: Criar nova avaliação pós-corte concluído
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { appointmentId, topLengthFeedback, beardLineFeedback } = body;

    const validTopLength = ["Ideal", "Mais curto", "Mais comprido"];
    const validBeardLine = ["Está perfeita", "Mais marcada", "Mais natural", "Não aplicável"];
    if (
      !appointmentId ||
      !validTopLength.includes(topLengthFeedback) ||
      !validBeardLine.includes(beardLineFeedback)
    ) {
      return NextResponse.json({ error: "Dados de avaliação inválidos" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { review: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Marcação não encontrada" }, { status: 404 });
    }

    if (appointment.userId !== session.user.id) {
      return NextResponse.json({ error: "Não tens permissão para avaliar esta marcação" }, { status: 403 });
    }

    if (appointment.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Apenas podes avaliar serviços que já foram concluídos pelo Diogo" },
        { status: 400 }
      );
    }
    if (!appointment.reviewAvailableAt || appointment.reviewAvailableAt > new Date()) {
      return NextResponse.json(
        { error: "O feedback privado fica disponível 24 horas após a conclusão do serviço." },
        { status: 400 }
      );
    }

    if (appointment.review) {
      return NextResponse.json({ error: "Esta marcação já foi avaliada anteriormente" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        appointmentId,
        userId: session.user.id,
        rating: 5,
        isPrivate: true,
        topLengthFeedback,
        beardLineFeedback,
        privateNotes: JSON.stringify({ topLengthFeedback, beardLineFeedback }),
      },
    });

    // Atribuir pontos de fidelização se ainda não tiver
    await prisma.loyalty.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        points: 20, // 20 pontos por avaliação/visita
        visits: 1,
      },
      update: {
        points: { increment: 20 },
        visits: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/reviews]", error);
    return NextResponse.json({ error: "Erro ao submeter avaliação" }, { status: 500 });
  }
}
