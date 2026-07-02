"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { apiFetch } from "@/lib/api-client";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const code = joinCode.trim().toUpperCase();
      const event = await apiFetch<{ id: string }>(
        `/api/events?joinCode=${encodeURIComponent(code)}`
      );
      router.push(`/join/${event.id}?code=${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "参加コードが無効です");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-500 to-amber-400">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl">
              🎯
            </div>
            <h1 className="text-2xl font-bold text-slate-900">交流ビンゴ</h1>
            <p className="mt-2 text-sm text-slate-600">
              会場で人を探して話しかけ、ビンゴを完成させよう
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              label="参加コード"
              placeholder="例: ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              required
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg">
              イベントに参加
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <Link
              href="/admin"
              className="text-sm text-indigo-600 hover:underline"
            >
              管理者の方はこちら
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
