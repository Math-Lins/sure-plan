import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { registrarLog } from "@/lib/log";

const STATUS_VALIDOS = ["pendente", "ganhou", "perdeu", "devolvida", "cashout"];

function getUserId(session: any): string | null {
  return session?.user ? (session.user as any).id : null;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const aposta = await prisma.aposta.findFirst({
    where: { id, userId },
    include: { casas: true },
  });

  if (!aposta) return NextResponse.json({ error: "Aposta não encontrada" }, { status: 404 });
  return NextResponse.json(aposta);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { casaId, status, valorCashout } = body;

  if (!casaId || typeof casaId !== "string") {
    return NextResponse.json({ error: "casaId inválido" }, { status: 400 });
  }
  if (!STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  if (status === "cashout") {
    if (valorCashout === undefined || valorCashout === null || isNaN(Number(valorCashout)) || Number(valorCashout) < 0) {
      return NextResponse.json({ error: "Valor de cashout inválido" }, { status: 400 });
    }
  }

  const casa = await prisma.casa.findFirst({
    where: { id: casaId, aposta: { userId } },
  });
  if (!casa) return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });

  const updated = await prisma.casa.update({
    where: { id: casaId },
    data: {
      status,
      valorCashout: status === "cashout" ? Number(valorCashout) : null,
    },
  });

  return NextResponse.json(updated);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const aposta = await prisma.aposta.findFirst({ where: { id, userId } });
  if (!aposta) return NextResponse.json({ error: "Aposta não encontrada" }, { status: 404 });

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
    if (!c.nome || typeof c.nome !== "string") return NextResponse.json({ error: "Nome da casa inválido" }, { status: 400 });
    if (!c.odd || isNaN(Number(c.odd)) || Number(c.odd) <= 0) return NextResponse.json({ error: "Odd inválida" }, { status: 400 });
    if (!c.investimento || isNaN(Number(c.investimento)) || Number(c.investimento) <= 0) return NextResponse.json({ error: "Investimento inválido" }, { status: 400 });
  }

  try {
    const atualizada = await prisma.$transaction(async (tx) => {
      await tx.casa.deleteMany({ where: { apostaId: id } });
      return tx.aposta.update({
        where: { id },
        data: {
          data,
          horario: horario || "",
          mercado: mercado || "",
          observacao: observacao || "",
          casas: {
            create: casas.map((c: any) => ({
              nome: c.nome,
              odd: Number(c.odd),
              investimento: Number(c.investimento),
              status: STATUS_VALIDOS.includes(c.status) ? c.status : "pendente",
              valorCashout: c.valorCashout ? Number(c.valorCashout) : null,
            })),
          },
        },
        include: { casas: true },
      });
    });

    return NextResponse.json(atualizada);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar aposta" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const aposta = await prisma.aposta.findFirst({ where: { id, userId } });
  if (!aposta) return NextResponse.json({ error: "Aposta não encontrada" }, { status: 404 });

  await prisma.aposta.delete({ where: { id } });

  await registrarLog({
    userId,
    userNome: session.user?.name ?? undefined,
    acao: "excluir_aposta",
    detalhes: `Aposta ${id} excluída`,
  });

  return NextResponse.json({ ok: true });
}
