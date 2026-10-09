import { prisma } from "@/lib/prisma";

export async function getSettings() {
  try {
    let setting = await prisma.setting.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      setting = await prisma.setting.create({
        data: {
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
    }

    return setting;
  } catch (error) {
    return {
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
    };
  }
}
