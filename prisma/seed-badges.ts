import { PrismaClient } from "@prisma/client";
import { SYSTEM_BADGES } from "../src/lib/badges/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding badge definitions...");

  let created = 0;
  let updated = 0;

  for (const badge of SYSTEM_BADGES) {
    const result = await prisma.badgeDefinition.upsert({
      where: { key: badge.key },
      create: {
        key: badge.key,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        tier: badge.tier,
        source: "system",
        triggerConfig: JSON.stringify(badge.triggerConfig),
      },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        tier: badge.tier,
        triggerConfig: JSON.stringify(badge.triggerConfig),
      },
    });

    // Check if this was a create or update by comparing createdAt ~ updatedAt
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`Done! Created ${created}, updated ${updated} badge definitions (${SYSTEM_BADGES.length} total).`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
