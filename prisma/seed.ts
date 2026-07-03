import "dotenv/config";
import { createPrismaClient } from "../src/lib/create-prisma-client";
import { seedDemoData } from "./demo-data";

const prisma = createPrismaClient();
const force = process.argv.includes("--force");

seedDemoData(prisma, { force })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
