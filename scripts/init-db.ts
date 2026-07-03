import "dotenv/config";
import { execSync } from "node:child_process";
import { createPrismaClient } from "../src/lib/create-prisma-client";
import { seedDemoData } from "../prisma/demo-data";

function runMigrations() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
}

async function main() {
  runMigrations();

  const prisma = createPrismaClient();

  try {
    await seedDemoData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
