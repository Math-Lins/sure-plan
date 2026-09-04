import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { rateLimit } from "@/lib/rateLimit";
import { registrarLog } from "@/lib/log";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, "");
  if (nums.length !== 11 || /^(\d)\1{10}$/.test(nums)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(nums[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(nums[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(nums[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === Number(nums[10]);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = rateLimit(`register:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { email, nome, senha, cpf, dataNascimento, convite } = body;

  // Se vier convite, valida no banco (mas não é obrigatório)
  let conviteDoc: { id: string; token: string; usado: boolean } | null = null;
  if (convite) {
    conviteDoc = await prisma.convite.findUnique({ where: { token: String(convite).toUpperCase() } });
    if (!conviteDoc || conviteDoc.usado) {
      return NextResponse.json({ error: "Convite inválido ou já utilizado." }, { status: 403 });
    }
  }

  if (!email || !nome || !senha || !cpf || !dataNascimento) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }
  if (typeof nome !== "string" || nome.trim().length < 2) {
    return NextResponse.json({ error: "Nome deve ter pelo menos 2 caracteres." }, { status: 400 });
  }

  const emailNormalizado = email.toLowerCase().trim();
  if (!EMAIL_REGEX.test(emailNormalizado)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }
  if (typeof senha !== "string" || senha.length < 8) {
    return NextResponse.json({ error: "Senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }
  if (!CPF_REGEX.test(cpf)) {
    return NextResponse.json({ error: "CPF inválido. Use o formato 000.000.000-00." }, { status: 400 });
  }
  if (!validarCPF(cpf)) {
    return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
  }
  if (typeof dataNascimento !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
    return NextResponse.json({ error: "Data de nascimento inválida." }, { status: 400 });
  }

  try {
    const usuarioExistente = await prisma.user.findUnique({ where: { email: emailNormalizado } });
    if (usuarioExistente) {
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
    }

    const cpfExistente = await prisma.user.findUnique({ where: { cpf } });
    if (cpfExistente) {
      return NextResponse.json({ error: "CPF já cadastrado." }, { status: 409 });
    }

    const senhaHash = await bcryptjs.hash(senha, 10);

    const ops: any[] = [
      prisma.user.create({
        data: {
          email: emailNormalizado,
          nome: nome.trim(),
          senha: senhaHash,
          cpf,
          dataNascimento,
        },
      }),
    ];

    if (conviteDoc) {
      ops.push(prisma.convite.update({ where: { token: conviteDoc.token }, data: { usado: true } }));
    }

    await prisma.$transaction(ops);

    await registrarLog({
      acao: "cadastro",
      userNome: nome.trim(),
      detalhes: `Novo usuário: ${emailNormalizado}`,
    });

    return NextResponse.json({ message: "Conta criada com sucesso." }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      const campo = error.meta?.target?.includes("cpf") ? "CPF" : "E-mail";
      return NextResponse.json({ error: `${campo} já cadastrado.` }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}
