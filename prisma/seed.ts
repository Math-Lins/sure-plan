import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcryptjs.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@surestack.com" },
    update: {},
    create: {
      email: "admin@surestack.com",
      nome: "Admin",
      senha: senhaHash,
    },
  });

  console.log("✅ Usuário criado:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
