import { prisma } from "./prisma";

export async function registrarLog(params: {
  userId?: string;
  userNome?: string;
  acao: string;
  detalhes?: string;
}) {
  try {
    await prisma.log.create({ data: params });
  } catch {
    // log nunca deve quebrar a operação principal
  }
}
