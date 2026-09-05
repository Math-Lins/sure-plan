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

  const logs = await prisma.log.findMany({
    orderBy: { criadoEm: "desc" },
    take: 200,
  });

  return NextResponse.json(logs);
}
