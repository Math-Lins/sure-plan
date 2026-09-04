import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nome: true, email: true, cpf: true, dataNascimento: true, role: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { nome, senhaAtual, novaSenha } = body;

  if (!nome || typeof nome !== "string" || nome.trim().length < 2) {
    return NextResponse.json({ error: "Nome deve ter pelo menos 2 caracteres." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const data: any = { nome: nome.trim() };

  // Só altera senha se o usuário enviou os campos
  if (senhaAtual || novaSenha) {
    if (!senhaAtual || !novaSenha) {
      return NextResponse.json({ error: "Informe a senha atual e a nova senha." }, { status: 400 });
    }
    if (novaSenha.length < 8) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const senhaValida = await bcryptjs.compare(senhaAtual, user.senha);
    if (!senhaValida) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
    }

    data.senha = await bcryptjs.hash(novaSenha, 10);
  }

  const atualizado = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, nome: true, email: true, cpf: true, dataNascimento: true, role: true },
  });

  return NextResponse.json(atualizado);
}
