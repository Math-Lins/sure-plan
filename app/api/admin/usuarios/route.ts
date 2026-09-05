import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

function isMaster(session: any) {
  return session?.user && (session.user as any).role === "master";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isMaster(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const usuarios = await prisma.user.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      cpf: true,
      dataNascimento: true,
      criadoEm: true,
      _count: { select: { apostas: true, ganhos: true } },
    },
    orderBy: { criadoEm: "asc" },
  });

  return NextResponse.json(usuarios);
}
