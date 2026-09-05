import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const ganhos = await prisma.ganho.findMany({
    where: { userId },
    orderBy: { data: "desc" },
  });

  return NextResponse.json(ganhos);
}

const TIPOS_GANHO = ["lucro", "perda"];

export async function POST(request: NextRequest) {
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

  const { data, tipo, casa, valor, observacao } = body;

  if (!data || typeof data !== "string") {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }
  if (!TIPOS_GANHO.includes(tipo)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!casa || typeof casa !== "string") {
    return NextResponse.json({ error: "Casa inválida" }, { status: 400 });
  }
  if (isNaN(Number(valor)) || Number(valor) <= 0) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  try {
    const ganho = await prisma.ganho.create({
      data: {
        userId,
        data,
        tipo,
        casa,
        valor: Number(valor),
        observacao: observacao || null,
      },
    });

    return NextResponse.json(ganho, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar ganho" }, { status: 500 });
  }
}
