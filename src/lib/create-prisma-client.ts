import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL が設定されていません。Vercel / .env に Supabase の接続文字列を設定してください。"
    );
  }

  const isSupabase = connectionString.includes("supabase.co");

  const pool = new Pool({
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    max: process.env.NODE_ENV === "production" ? 1 : 10,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
