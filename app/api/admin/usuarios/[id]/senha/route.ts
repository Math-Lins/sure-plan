import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { registrarLog } from "@/lib/log";

function isMaster(session: any) {
  return session?.user && (session.user as any).role === "master";
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isMaster(session)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { novaSenha } = body;

  if (!novaSenha || typeof novaSenha !== "string" || novaSenha.length < 8) {
    return NextResponse.json({ error: "Nova senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  const masterId = (session!.user as any).id;

  const usuario = await prisma.user.findUnique({ where: { id } });
  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (usuario.role === "master" && id !== masterId) {
    return NextResponse.json({ error: "Não é possível redefinir a senha de outro master." }, { status: 403 });
  }

  const hash = await bcryptjs.hash(novaSenha, 10);
  await prisma.user.update({ where: { id }, data: { senha: hash } });

  await registrarLog({
    userId: masterId,
    userNome: session!.user?.name ?? undefined,
    acao: "reset_senha",
    detalhes: `Senha de "${usuario.nome}" (${usuario.email}) redefinida pelo master`,
  });

  return NextResponse.json({ ok: true });
}
