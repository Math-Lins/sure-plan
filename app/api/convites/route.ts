import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

function isMaster(session: any) {
  return session?.user && (session.user as any).role === "master";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isMaster(session)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const convites = await prisma.convite.findMany({
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(convites);
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isMaster(session)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();

  const convite = await prisma.convite.create({
    data: { token },
  });

  return NextResponse.json(convite, { status: 201 });
}
