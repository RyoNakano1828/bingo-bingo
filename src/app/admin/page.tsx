"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PageShell } from "@/components/PageShell";
import { apiFetch, saveAdminToken } from "@/lib/api-client";

export default function AdminHomePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loginEventId, setLoginEventId] = useState("");
  const [loginToken, setLoginToken] = useState("");
  const [created, setCreated] = useState<{
    id: string;
    joinCode: string;
    adminToken: string;
  } | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const event = await apiFetch<{
        id: string;
        joinCode: string;
        adminToken: string;
      }>("/api/events", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      saveAdminToken(event.id, event.adminToken);
      setCreated(event);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    saveAdminToken(loginEventId.trim(), loginToken.trim());
    router.push(`/admin/events/${loginEventId.trim()}`);
  }

  return (
    <PageShell title="管理者" subtitle="イベントの作成・管理" backHref="/">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">新規イベント作成</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="イベント名"
              placeholder="例: 新入社員交流会 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <Button type="submit">イベントを作成</Button>
          </form>

          {created && (
            <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm">
              <p className="font-medium text-emerald-800">イベントを作成しました</p>
              <p className="mt-2">
                参加コード:{" "}
                <span className="font-mono font-bold">{created.joinCode}</span>
              </p>
              <p className="mt-1 break-all text-emerald-700">
                管理者トークン（大切に保管）: {created.adminToken}
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push(`/admin/events/${created.id}`)}
              >
                管理画面へ
              </Button>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">既存イベントにログイン</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="イベントID"
              value={loginEventId}
              onChange={(e) => setLoginEventId(e.target.value)}
              required
            />
            <Input
              label="管理者トークン"
              value={loginToken}
              onChange={(e) => setLoginToken(e.target.value)}
              required
            />
            <Button type="submit" variant="secondary">
              ログイン
            </Button>
          </form>
        </section>
      </div>
    </PageShell>
  );
}
