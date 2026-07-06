"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { ImageUpload } from "@/components/ImageUpload";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { PageShell } from "@/components/PageShell";
import { useEvent } from "@/contexts/EventContext";
import {
  apiFetch,
  invalidateApiCache,
  saveParticipantSession,
} from "@/lib/api-client";
import { useParticipantSession } from "@/hooks/useParticipantSession";

type Participant = {
  id: string;
  name: string;
  iconUrl: string | null;
  profile?: string | null;
  groupId: string | null;
};

type AnswerRow = { id: string; text: string; answer: string };

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const session = useParticipantSession();
  const { event } = useEvent();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [profile, setProfile] = useState("");
  const [groupId, setGroupId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<AnswerRow[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);

  const editable = event?.status === "draft";
  const gameFinished = event?.status === "finished";
  const selected = participants.find((p) => p.id === selectedId) ?? null;
  const isSelf = selected?.id === session?.userId;

  async function loadParticipants() {
    if (!session) return;
    const data = await apiFetch<Participant[]>(
      `/api/events/${eventId}/users`,
      { userId: session.userId, cacheTtlMs: 0 }
    );
    setParticipants(data);
  }

  useEffect(() => {
    if (!session || session.eventId !== eventId) {
      router.replace(`/join/${eventId}`);
      return;
    }

    loadParticipants()
      .catch((err) => {
        setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, router, session]);

  function openDetail(userId: string) {
    setSelectedId(userId);
    setEditing(false);
    setMessage("");
    setError("");
    setUserAnswers([]);
  }

  function openEdit(user: Participant) {
    setName(user.name);
    setIconUrl(user.iconUrl ?? "");
    setProfile(user.profile ?? "");
    setGroupId(user.groupId ?? "");
    setEditing(true);
    setMessage("");
    setError("");
  }

  function backToList() {
    setSelectedId(null);
    setEditing(false);
    setMessage("");
    setError("");
    setUserAnswers([]);
  }

  useEffect(() => {
    if (!session || !selectedId || !gameFinished) {
      setUserAnswers([]);
      return;
    }

    let cancelled = false;
    setAnswersLoading(true);

    apiFetch<AnswerRow[]>(
      `/api/events/${eventId}/users/${selectedId}/answers`,
      { userId: session.userId, cacheTtlMs: 0 }
    )
      .then((data) => {
        if (!cancelled) setUserAnswers(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "回答の読み込みに失敗しました");
        }
      })
      .finally(() => {
        if (!cancelled) setAnswersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, gameFinished, selectedId, session]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setError("");
    setMessage("");
    try {
      await apiFetch(`/api/events/${eventId}/users/${session.userId}`, {
        method: "PATCH",
        userId: session.userId,
        body: JSON.stringify({ name, iconUrl, profile, groupId }),
      });
      invalidateApiCache(`/api/events/${eventId}/users`);
      saveParticipantSession({ ...session, name });
      await loadParticipants();
      setEditing(false);
      setMessage("プロフィールを保存しました");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  }

  if (!session) return null;

  if (loading) {
    return (
      <PageShell title="プロフィール" backHref={`/event/${eventId}/home`}>
        <p className="text-slate-500">読み込み中...</p>
      </PageShell>
    );
  }

  if (selected && !editing) {
    return (
      <PageShell
        title={selected.name}
        subtitle={isSelf ? "自分のプロフィール" : "参加者プロフィール"}
        backHref={`/event/${eventId}/home`}
      >
        <div className="mx-auto max-w-md space-y-6">
          <button
            type="button"
            onClick={backToList}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← 参加者一覧に戻る
          </button>

          <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <Avatar
              name={selected.name}
              iconUrl={selected.iconUrl}
              size="xl"
            />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              {selected.name}
            </h2>
            {selected.groupId && (
              <p className="mt-1 text-sm text-slate-500">{selected.groupId}</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700">自己紹介</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
              {selected.profile?.trim() || "（未設定）"}
            </p>
          </div>

          {gameFinished && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">
                質問と回答
              </h3>
              {answersLoading ? (
                <p className="mt-3 text-sm text-slate-500">読み込み中...</p>
              ) : userAnswers.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  回答はありません
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {userAnswers.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/80 p-4"
                    >
                      <p className="text-sm font-medium text-indigo-900">
                        Q. {item.text}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {item.answer.trim() || "（未回答）"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          )}

          {isSelf && editable && (
            <Button className="w-full" onClick={() => openEdit(selected)}>
              プロフィールを編集
            </Button>
          )}

          {isSelf && !editable && (
            <p className="text-center text-sm text-slate-500">
              ゲーム開始後はプロフィールを編集できません
            </p>
          )}
        </div>
      </PageShell>
    );
  }

  if (selected && editing && isSelf) {
    return (
      <PageShell
        title="プロフィール編集"
        subtitle={session.name}
        backHref={`/event/${eventId}/home`}
      >
        <div className="mx-auto max-w-md space-y-4">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← 詳細に戻る
          </button>

          <form
            onSubmit={handleSave}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <ImageUpload
              value={iconUrl}
              onChange={setIconUrl}
              name={name || session.name}
            />
            <Input
              label="名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Textarea
              label="自己紹介"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
            />
            <Input
              label="グループ"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full">
              保存
            </Button>
          </form>
        </div>
      </PageShell>
    );
  }

  const self = participants.find((p) => p.id === session.userId);

  return (
    <PageShell
      title="プロフィール"
      subtitle={`${participants.length} 人が参加中`}
      backHref={`/event/${eventId}/home`}
    >
      <div className="mx-auto max-w-md space-y-6">
        {self && (
          <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-indigo-900">
                自分のプロフィール
              </h2>
              <button
                type="button"
                onClick={() => {
                  openDetail(self.id);
                  if (editable) openEdit(self);
                }}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                {editable ? "編集" : "詳細"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => openDetail(self.id)}
              className="flex w-full items-center gap-3 rounded-lg bg-white p-3 text-left shadow-sm transition hover:shadow"
            >
              <Avatar name={self.name} iconUrl={self.iconUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{self.name}</p>
                {self.groupId && (
                  <p className="truncate text-xs text-slate-500">
                    {self.groupId}
                  </p>
                )}
              </div>
            </button>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            参加者一覧
          </h2>
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <ul className="space-y-2">
            {participants.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => openDetail(user.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-200 hover:shadow"
                >
                  <Avatar name={user.name} iconUrl={user.iconUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">
                      {user.name}
                      {user.id === session.userId && (
                        <span className="ml-2 text-xs text-indigo-600">
                          （自分）
                        </span>
                      )}
                    </p>
                    {user.groupId && (
                      <p className="truncate text-xs text-slate-500">
                        {user.groupId}
                      </p>
                    )}
                    {user.profile && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                        {user.profile}
                      </p>
                    )}
                  </div>
                  <span className="text-slate-400">›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
