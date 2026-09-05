import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { registrarLog } from "@/lib/log";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const apostas = await prisma.aposta.findMany({
    where: { userId },
    include: { casas: true },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(apostas);
}

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

  const { data, horario, mercado, observacao, casas } = body;

  if (!data || typeof data !== "string") {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }
  if (!Array.isArray(casas) || casas.length === 0) {
    return NextResponse.json({ error: "Informe pelo menos uma casa" }, { status: 400 });
  }
  for (const c of casas) {
    if (!c.nome || typeof c.nome !== "string") {
      return NextResponse.json({ error: "Nome da casa inválido" }, { status: 400 });
    }
    if (!c.odd || isNaN(Number(c.odd)) || Number(c.odd) <= 0) {
      return NextResponse.json({ error: "Odd inválida" }, { status: 400 });
    }
    if (!c.investimento || isNaN(Number(c.investimento)) || Number(c.investimento) <= 0) {
      return NextResponse.json({ error: "Investimento inválido" }, { status: 400 });
    }
  }

  try {
    const aposta = await prisma.aposta.create({
      data: {
        userId,
        data,
        horario: horario || "",
        mercado: mercado || "",
        observacao: observacao || null,
        casas: {
          create: casas.map((c: any) => ({
            nome: c.nome,
            odd: Number(c.odd),
            investimento: Number(c.investimento),
            status: "pendente",
          })),
        },
      },
      include: { casas: true },
    });

    await registrarLog({
      userId,
      userNome: session.user?.name ?? undefined,
      acao: "criar_aposta",
      detalhes: `Data: ${data}, casas: ${casas.map((c: any) => c.nome).join(", ")}`,
    });

    return NextResponse.json(aposta, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar aposta" }, { status: 500 });
  }
}
