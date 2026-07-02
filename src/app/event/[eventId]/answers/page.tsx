"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PageShell } from "@/components/PageShell";
import { useEvent } from "@/contexts/EventContext";
import { apiFetch } from "@/lib/api-client";
import { useParticipantSession } from "@/hooks/useParticipantSession";

type AnswerRow = { id: string; text: string; answer: string };

export default function AnswersPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const session = useParticipantSession();
  const { event } = useEvent();

  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session || session.eventId !== eventId) {
      router.replace(`/join/${eventId}`);
      return;
    }

    let cancelled = false;

    async function load() {
      const answerData = await apiFetch<AnswerRow[]>(
        `/api/events/${eventId}/users/${session!.userId}/answers`,
        { userId: session!.userId }
      );
      if (!cancelled) {
        setAnswers(answerData);
        setLoaded(true);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [eventId, router, session]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setError("");
    try {
      await apiFetch(`/api/events/${eventId}/users/${session.userId}/answers`, {
        method: "PUT",
        userId: session.userId,
        body: JSON.stringify({
          answers: answers.map((a) => ({
            questionId: a.id,
            answer: a.answer,
          })),
        }),
      });
      setMessage("回答を保存しました");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  }

  function updateAnswer(id: string, value: string) {
    setAnswers((prev) =>
      prev.map((a) => (a.id === id ? { ...a, answer: value } : a))
    );
  }

  if (!session) return null;

  const editable = event?.status === "draft";

  return (
    <PageShell
      title="質問への回答"
      subtitle="本人以外には公開されません"
      backHref={`/event/${eventId}/home`}
    >
      <form
        onSubmit={handleSave}
        className="mx-auto max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {answers.length === 0 && loaded && (
          <p className="text-sm text-slate-500">
            管理者が質問を登録するまでお待ちください
          </p>
        )}
        {answers.map((item) => (
          <div key={item.id} className="rounded-lg bg-slate-50 p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">{item.text}</p>
            <Input
              placeholder="あなたの回答"
              value={item.answer}
              onChange={(e) => updateAnswer(item.id, e.target.value)}
              disabled={!editable}
              required
            />
          </div>
        ))}
        {!editable && (
          <p className="text-sm text-slate-500">
            ゲーム開始後は回答を編集できません
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
        {editable && answers.length > 0 && (
          <Button type="submit" className="w-full">
            回答を保存
          </Button>
        )}
      </form>
    </PageShell>
  );
}
