import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function assertVercelCompatibleUrl(connectionString: string) {
  const onVercel = Boolean(process.env.VERCEL);
  const usesDirectDbHost =
    connectionString.includes("db.") &&
    connectionString.includes(".supabase.co") &&
    !connectionString.includes("pooler.supabase.com");

  if (onVercel && usesDirectDbHost) {
    throw new Error(
      "DATABASE_URL が db.xxxx.supabase.co になっています。Vercel は IPv6 非対応のため接続できません。" +
        "Supabase ダッシュボードの Transaction pooler（pooler.supabase.com:6543、ユーザー postgres.[REF]）の URI を設定してください。"
    );
  }
}

export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL が設定されていません。Vercel / .env に Supabase の接続文字列を設定してください。"
    );
  }

  assertVercelCompatibleUrl(connectionString);

  const isSupabase = connectionString.includes("supabase");

  const pool = new Pool({
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    max: process.env.NODE_ENV === "production" ? 1 : 10,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
