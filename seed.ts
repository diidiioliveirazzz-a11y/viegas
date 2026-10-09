import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Seeding database...");

  // 1. Settings
  const setting = await prisma.setting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      minAdvanceHours: 8,
      openTime: "09:00",
      closeTime: "19:00",
      lunchStart: "13:00",
      lunchEnd: "14:00",
      barberName: "Diogo Viegas",
      shopName: "Viegas Barber",
      address: "Rua Vieira da Silva, 12, Lisboa",
      phone: "+351 912 345 678",
    },
  });

  // 2. Services
  const servicesCount = await prisma.service.count();
  if (servicesCount === 0) {
    await prisma.service.createMany({
      data: [
        {
          name: "Corte Tradicional / Fade",
          description: "Corte de cabelo à tesoura ou máquina com degradê perfeito e lavagem incluída.",
          price: 15.0,
          duration: 35,
        },
        {
          name: "Barba Terapia",
          description: "Modelação e aparo de barba com aplicação de toalha quente e óleos essenciais.",
          price: 12.0,
          duration: 25,
        },
        {
          name: "Corte + Barba Premium",
          description: "A experiência completa de cuidado masculino com finalização de excelência.",
          price: 25.0,
          duration: 55,
        },
        {
          name: "Corte Infantil",
          description: "Corte dedicado para os mais novos com toda a paciência e atenção.",
          price: 13.0,
          duration: 30,
        },
        {
          name: "Camuflagem de Cabelo / Barba",
          description: "Disfarce natural de cabelos brancos com produtos sem amoníaco.",
          price: 18.0,
          duration: 30,
        },
      ],
    });
    console.log("Serviços criados!");
  }

  // 3. HairStyles (Galeria)
  const hairCount = await prisma.hairStyle.count();
  if (hairCount === 0) {
    await prisma.hairStyle.createMany({
      data: [
        {
          title: "Low Taper Fade",
          category: "Taper Fade",
          description: "Degradê suave nas patilhas e nuca, mantendo volume no topo.",
          imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80",
          likes: 34,
        },
        {
          title: "Mid Fade com Textura",
          category: "Mid Fade",
          description: "Fade médio clássico com textura natural no topo para styling despojado.",
          imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
          likes: 48,
        },
        {
          title: "High Skin Fade",
          category: "High Fade",
          description: "Degradê a zero alto, limpo, moderno e com contraste expressivo.",
          imageUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=800&q=80",
          likes: 52,
        },
        {
          title: "French Crop com Franja Reta",
          category: "Textured Crop",
          description: "Estilo urbano europeu com textura forte e franja definida.",
          imageUrl: "https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=800&q=80",
          likes: 29,
        },
        {
          title: "Classic Slick Back",
          category: "Slick Back",
          description: "Penteado puxado para trás com pomada brilhante e linhas elegantes.",
          imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
          likes: 41,
        },
        {
          title: "Modern Mullet Fade",
          category: "Mullet",
          description: "Reinterpretação contemporânea do mullet com laterais limpas em fade.",
          imageUrl: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=80",
          likes: 37,
        },
      ],
    });
    console.log("Estilos de cabelo inseridos!");
  }

  // 4. Products (Loja)
  const productsCount = await prisma.product.count();
  if (productsCount === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: "Matte Clay Viegas Barber",
          description: "Cera modeladora com acabamento mate natural e fixação forte de longa duração.",
          price: 16.50,
          stock: 18,
          category: "Ceras",
          imageUrl: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Pomada Pomade Classic Shine",
          description: "Fórmula à base de água que confere brilho clássico sem resíduos gordurosos.",
          price: 15.00,
          stock: 12,
          category: "Pomadas",
          imageUrl: "https://images.unsplash.com/photo-1598452963314-b09f397a5c48?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Óleo Fortificante de Barba",
          description: "Mistura nutritiva de óleos de argão e jojoba para hidratar fios e pele.",
          price: 14.00,
          stock: 25,
          category: "Barba",
          imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80",
        },
        {
          name: "Shampoo Revitalizante Mentolado",
          description: "Sensação refrescante imediata e limpeza profunda para couro cabeludo masculino.",
          price: 13.50,
          stock: 14,
          category: "Shampoos",
          imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80",
        },
      ],
    });
    console.log("Produtos criados!");
  }

  // 5. Rewards (Fidelização)
  const rewardsCount = await prisma.reward.count();
  if (rewardsCount === 0) {
    await prisma.reward.createMany({
      data: [
        {
          title: "10% de Desconto num Produto",
          description: "Válido para qualquer cera ou óleo de barba da loja.",
          pointsCost: 50,
        },
        {
          title: "Barba Grátis",
          description: "Serviço de barba terapia de oferta no teu próximo corte.",
          pointsCost: 100,
        },
        {
          title: "Corte de Cabelo Grátis",
          description: "Um corte completo gratuito por seres cliente fiel.",
          pointsCost: 180,
        },
      ],
    });
    console.log("Recompensas criadas!");
  }

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
