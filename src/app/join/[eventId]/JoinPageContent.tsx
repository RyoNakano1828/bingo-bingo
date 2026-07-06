"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { ImageUpload } from "@/components/ImageUpload";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { PageShell } from "@/components/PageShell";
import {
  EventInfo,
  apiFetch,
  getParticipantSession,
  saveParticipantSession,
} from "@/lib/api-client";

export default function JoinPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [profile, setProfile] = useState("");
  const [groupId, setGroupId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<EventInfo>(`/api/events/${eventId}`);
        setEvent(data);

        const session = getParticipantSession();
        if (session?.eventId === eventId) {
          router.replace(`/event/${eventId}/home`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId, router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const user = await apiFetch<{ id: string; name: string }>(
        `/api/events/${eventId}/users`,
        {
          method: "POST",
          body: JSON.stringify({ name, iconUrl, profile, groupId }),
        }
      );
      saveParticipantSession({
        eventId,
        userId: user.id,
        name: user.name,
      });
      router.push(`/event/${eventId}/home`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    }
  }

  if (loading) {
    return (
      <PageShell title="読み込み中..." backHref="/">
        <p className="text-slate-500">読み込み中...</p>
      </PageShell>
    );
  }

  const joinCode = searchParams.get("code");

  return (
    <PageShell
      title={event?.title ?? "イベント参加"}
      subtitle={joinCode ? `参加コード: ${joinCode}` : undefined}
      backHref="/"
    >
      {event?.status !== "draft" && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          このイベントはすでに開始されています。新規登録はできません。
        </p>
      )}

      <form
        onSubmit={handleRegister}
        className="mx-auto max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold">プロフィール登録</h2>
        <Input
          label="名前 *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={event?.status !== "draft"}
        />
        <ImageUpload
          value={iconUrl}
          onChange={setIconUrl}
          name={name || "?"}
          disabled={event?.status !== "draft"}
        />
        <Textarea
          label="自己紹介"
          placeholder="簡単な自己紹介を書いてください"
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          disabled={event?.status !== "draft"}
        />
        <Input
          label="グループ（任意）"
          placeholder="例: 営業部"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          disabled={event?.status !== "draft"}
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={event?.status !== "draft"}
        >
          登録して参加
        </Button>
      </form>
    </PageShell>
  );
}
