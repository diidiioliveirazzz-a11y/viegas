import { prisma } from "../src/lib/prisma";

async function main() {
  // Atualizar o primeiro utilizador para ADMIN+BARBER
  const users = await prisma.user.findMany();
  console.log("Utilizadores existentes:");
  users.forEach(u => console.log(`  - ${u.email} | role: ${u.role}`));

  if (users.length > 0) {
    const firstUser = users[0];
    const updated = await prisma.user.update({
      where: { id: firstUser.id },
      data: { role: "ADMIN" },
    });
    console.log(`\n✅ Utilizador "${updated.email}" atualizado para role: ${updated.role}`);
  } else {
    console.log("Nenhum utilizador encontrado. Cria primeiro uma conta em /register.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
