import { NextResponse, NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { instagramLoginEmail, normalizeInstagramHandle } from "@/lib/auth-identifiers";

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Pedido inválido" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const loginMethod = input.loginMethod;
  const rawEmail = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const rawHandle = typeof input.instagramHandle === "string" ? input.instagramHandle : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { message: "O nome deve ter entre 2 e 80 caracteres" },
      { status: 400 }
    );
  }

  let email: string;
  if (loginMethod === "instagram") {
    const handle = normalizeInstagramHandle(rawHandle);
    if (!handle) {
      return NextResponse.json(
        { message: "Introduz um @ de Instagram válido" },
        { status: 400 }
      );
    }
    if (handle === "admin") {
      return NextResponse.json(
        { message: "Este utilizador está reservado para a conta do barbeiro" },
        { status: 409 }
      );
    }
    email = instagramLoginEmail(handle);
  } else if (loginMethod === "gmail") {
    if (
      rawEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)
    ) {
      return NextResponse.json(
        { message: "Introduz um endereço de email válido" },
        { status: 400 }
      );
    }
    email = rawEmail;
  } else {
    return NextResponse.json(
      { message: "Escolhe entrar com Instagram ou email" },
      { status: 400 }
    );
  }

  if (password.length < 8 || password.length > 128) {
    return NextResponse.json(
      { message: "A palavra-passe deve ter entre 8 e 128 caracteres" },
      { status: 400 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        {
          message:
            loginMethod === "instagram"
              ? "Este @ já tem uma conta Viegas Barber. Inicia sessão ou contacta a barbearia para recuperar o acesso."
              : "Este email já está registado",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "CLIENT" },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ message: "Conta criada com sucesso", user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Este identificador já está registado" },
        { status: 409 }
      );
    }

    console.error("Falha ao criar conta:", error);
    return NextResponse.json(
      { message: "Ocorreu um erro ao criar a conta" },
      { status: 500 }
    );
  }
}
