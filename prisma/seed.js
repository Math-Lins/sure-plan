const { PrismaClient } = require("@prisma/client");
const bcryptjs = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcryptjs.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { email: "matheuslins65@gmail.com" },
    update: { role: "master" },
    create: {
      email: "matheuslins65@gmail.com",
      nome: "Matheus",
      senha: senhaHash,
      role: "master",
    },
  });

  console.log("Usuário master criado:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
