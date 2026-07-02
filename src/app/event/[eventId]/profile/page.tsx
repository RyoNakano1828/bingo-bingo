"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { PageShell } from "@/components/PageShell";
import { useEvent } from "@/contexts/EventContext";
import { apiFetch } from "@/lib/api-client";
import { useParticipantSession } from "@/hooks/useParticipantSession";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const session = useParticipantSession();
  const { event } = useEvent();

  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [profile, setProfile] = useState("");
  const [groupId, setGroupId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session || session.eventId !== eventId) {
      router.replace(`/join/${eventId}`);
      return;
    }

    async function load() {
      const user = await apiFetch<{
        name: string;
        iconUrl: string | null;
        profile: string | null;
        groupId: string | null;
      }>(`/api/events/${eventId}/users/${session!.userId}`, {
        userId: session!.userId,
      });
      setName(user.name);
      setIconUrl(user.iconUrl ?? "");
      setProfile(user.profile ?? "");
      setGroupId(user.groupId ?? "");
    }
    load();
  }, [eventId, router, session]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setError("");
    try {
      await apiFetch(`/api/events/${eventId}/users/${session.userId}`, {
        method: "PATCH",
        userId: session.userId,
        body: JSON.stringify({ name, iconUrl, profile, groupId }),
      });
      setMessage("プロフィールを保存しました");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  }

  if (!session) return null;

  const editable = event?.status === "draft";

  return (
    <PageShell
      title="プロフィール"
      subtitle={session.name}
      backHref={`/event/${eventId}/home`}
    >
      <form
        onSubmit={handleSave}
        className="mx-auto max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <Input
          label="名前"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!editable}
          required
        />
        <Input
          label="アイコンURL"
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          disabled={!editable}
        />
        <Textarea
          label="自己紹介"
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          disabled={!editable}
        />
        <Input
          label="グループ"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          disabled={!editable}
        />
        {!editable && (
          <p className="text-sm text-slate-500">
            ゲーム開始後はプロフィールを編集できません
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {editable && (
          <Button type="submit" className="w-full">
            保存
          </Button>
        )}
      </form>
    </PageShell>
  );
}
