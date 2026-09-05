import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

function isMaster(session: any) {
  return session?.user && (session.user as any).role === "master";
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isMaster(session)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const convite = await prisma.convite.findUnique({ where: { id } });
    if (!convite) {
      return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
    }

    await prisma.convite.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Erro ao excluir convite:", error);
    return NextResponse.json({ error: error?.message ?? "Erro ao excluir convite." }, { status: 500 });
  }
}
