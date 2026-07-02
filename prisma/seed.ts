import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { seedDemoData } from "./demo-data";

function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!url.startsWith("file:")) return url;

  const filePath = url.slice("file:".length);
  if (path.isAbsolute(filePath)) return url;

  return `file:${path.join(process.cwd(), filePath)}`;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(),
});
const prisma = new PrismaClient({ adapter });

const force = process.argv.includes("--force");

seedDemoData(prisma, { force })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
