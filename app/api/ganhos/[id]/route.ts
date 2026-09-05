import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { id } = await params;

  const ganho = await prisma.ganho.findFirst({
    where: { id, userId },
  });

  if (!ganho) {
    return NextResponse.json({ error: "Ganho não encontrado" }, { status: 404 });
  }

  await prisma.ganho.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
