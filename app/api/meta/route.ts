import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { meta: true } });
  return NextResponse.json({ meta: user?.meta ?? 10000 });
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

  const { meta } = body;
  if (typeof meta !== "number" || isNaN(meta) || meta <= 0) {
    return NextResponse.json({ error: "Meta inválida" }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id: userId }, data: { meta } });
  return NextResponse.json({ meta: user.meta });
}
