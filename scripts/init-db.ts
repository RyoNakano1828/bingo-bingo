import { execSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { seedDemoData } from "../prisma/demo-data";

function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!url.startsWith("file:")) return url;

  const filePath = url.slice("file:".length);
  if (path.isAbsolute(filePath)) return url;

  return `file:${path.join(process.cwd(), filePath)}`;
}

function runMigrations() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
}

async function main() {
  runMigrations();

  const adapter = new PrismaBetterSqlite3({
    url: resolveDatabaseUrl(),
  });
  const prisma = new PrismaClient({ adapter });

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
