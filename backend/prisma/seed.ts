import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create users: 1 executive, 1 manager, 1 servidor
  const password = await bcrypt.hash("senha123", 10);

  const exec = await prisma.user.upsert({
    where: { email: "exec@jaboatao.pe.gov.br" },
    update: {},
    create: { name: "Secretário Executivo", email: "exec@jaboatao.pe.gov.br", password, role: "SECRETARIO_EXECUTIVO" },
  });

  const gerente = await prisma.user.upsert({
    where: { email: "gerente@jaboatao.pe.gov.br" },
    update: {},
    create: { name: "Gerente", email: "gerente@jaboatao.pe.gov.br", password, role: "GERENTE", executiveId: exec.id },
  });

  await prisma.user.upsert({
    where: { email: "servidor@jaboatao.pe.gov.br" },
    update: {},
    create: {
      name: "Servidor",
      email: "servidor@jaboatao.pe.gov.br",
      password,
      role: "SERVIDOR",
      managerId: gerente.id,
      executiveId: exec.id,
    },
  });

  console.log("Seed concluído. Usuários padrão criados.");
}

main().finally(async () => prisma.$disconnect());
