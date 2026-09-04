import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { registrarLog } from "@/lib/log";

function isMaster(session: any) {
  return session?.user && (session.user as any).role === "master";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isMaster(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;

  const { role } = await request.json();

  if (!["user", "master"].includes(role)) {
    return NextResponse.json({ error: "Role inválida" }, { status: 400 });
  }

  const usuario = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, nome: true, email: true, role: true },
  });

  await registrarLog({
    userId: (session!.user as any).id,
    userNome: session!.user?.name ?? undefined,
    acao: "alterar_role",
    detalhes: `Role de "${usuario.nome}" alterada para "${role}"`,
  });

  return NextResponse.json(usuario);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isMaster(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const masterId = (session!.user as any).id;

  if (id === masterId) {
    return NextResponse.json({ error: "Não é possível deletar o próprio usuário." }, { status: 400 });
  }

  const alvo = await prisma.user.findUnique({ where: { id }, select: { nome: true, email: true } });
  await prisma.user.delete({ where: { id } });

  await registrarLog({
    userId: (session!.user as any).id,
    userNome: session!.user?.name ?? undefined,
    acao: "excluir_usuario",
    detalhes: `Usuário "${alvo?.nome}" (${alvo?.email}) excluído`,
  });

  return NextResponse.json({ ok: true });
}
