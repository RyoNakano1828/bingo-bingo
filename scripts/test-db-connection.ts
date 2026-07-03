import "dotenv/config";
import { Pool } from "pg";

const PROJECT_REF = "rdvkulwcntrgnktlqunl";
const REGIONS = ["ap-northeast-1", "ap-northeast-2", "ap-southeast-1"];

function passwordFromEnv(): string | null {
  const source = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!source) return null;
  const match = source.match(/postgres(?:\.[^:@]+)?:(.+?)@/);
  return match?.[1] ?? null;
}

function buildPoolerUrl(cluster: number, region: string, password: string) {
  return `postgresql://postgres.${PROJECT_REF}:${password}@aws-${cluster}-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
}

async function tryConnect(label: string, connectionString: string) {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10_000,
  });

  try {
    await pool.query("select 1 as ok");
    console.log(`✅ ${label}`);
    console.log(`   ${connectionString.replace(/:([^:@/]+)@/, ":***@")}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.log(`❌ ${label}: ${message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  const password = passwordFromEnv();
  if (!password) {
    console.error("DIRECT_URL または DATABASE_URL からパスワードを取得できません。");
    process.exit(1);
  }

  const current = process.env.DATABASE_URL;
  if (current) {
    console.log("--- 現在の DATABASE_URL ---");
    await tryConnect("DATABASE_URL", current);
    console.log();
  }

  console.log("--- Shared Pooler (IPv4 / Vercel 向け) を探索 ---");
  for (const region of REGIONS) {
    for (const cluster of [0, 1, 2]) {
      const url = buildPoolerUrl(cluster, region, password);
      const ok = await tryConnect(`aws-${cluster}-${region}`, url);
      if (ok) {
        console.log("\n↑ この URI を Vercel の DATABASE_URL に設定してください。");
        return;
      }
    }
  }

  console.log(
    "\nどれも接続できませんでした。Supabase ダッシュボード → Database → Connection string → Transaction pooler から URI をコピーしてください。"
  );
  process.exit(1);
}

main();
