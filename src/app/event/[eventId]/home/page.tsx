"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { useEvent } from "@/contexts/EventContext";
import { apiFetch } from "@/lib/api-client";
import { useParticipantSession } from "@/hooks/useParticipantSession";

export default function ParticipantHomePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const session = useParticipantSession();
  const { event } = useEvent();

  const [answersComplete, setAnswersComplete] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    if (!session || session.eventId !== eventId) {
      router.replace(`/join/${eventId}`);
      return;
    }

    apiFetch<{ id: string; answer: string }[]>(
      `/api/events/${eventId}/users/${session.userId}/answers`,
      { userId: session.userId }
    )
      .then((answers) => {
        setAnswersComplete(
          answers.length > 0 && answers.every((a) => a.answer.trim())
        );
      })
      .finally(() => setPageReady(true));
  }, [eventId, router, session]);

  if (!session) return null;

  return (
    <PageShell
      title={event?.title ?? "交流ビンゴ"}
      subtitle={`こんにちは、${session.name} さん`}
      backHref="/"
    >
      {event?.status === "active" && (
        <Link
          href={`/event/${eventId}/card`}
          prefetch
          className="mb-6 block rounded-xl bg-indigo-600 p-4 text-center text-white shadow-lg transition hover:bg-indigo-700"
        >
          <p className="text-lg font-bold">🎯 ビンゴカードを開く</p>
          <p className="mt-1 text-sm text-indigo-100">
            会場で人を探して、マスを開けよう！
          </p>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href={`/event/${eventId}/profile`} prefetch>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
            <div className="mb-2 text-2xl">👤</div>
            <h2 className="font-semibold">プロフィール</h2>
            <p className="mt-1 text-sm text-slate-600">名前・自己紹介の確認・編集</p>
          </div>
        </Link>

        <Link href={`/event/${eventId}/answers`} prefetch>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
            <div className="mb-2 text-2xl">✏️</div>
            <h2 className="font-semibold">質問への回答</h2>
            <p className="mt-1 text-sm text-slate-600">
              {!pageReady
                ? "読み込み中..."
                : answersComplete
                  ? "回答済み ✓"
                  : "全質問に回答してください"}
            </p>
          </div>
        </Link>

        {(event?.status === "active" || event?.status === "finished") && (
          <Link href={`/event/${eventId}/card`} prefetch className="sm:col-span-2">
            <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-2 text-2xl">🎯</div>
              <h2 className="text-lg font-bold text-indigo-900">ビンゴカード</h2>
              <p className="mt-1 text-sm text-indigo-700">
                {event.status === "active"
                  ? "会場で人を探して、マスを開けよう！"
                  : "ゲーム終了 — カードを確認できます"}
              </p>
            </div>
          </Link>
        )}

        {(event?.status === "active" || event?.status === "finished") && (
          <Link href={`/event/${eventId}/ranking`} prefetch className="sm:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
              <div className="mb-2 text-2xl">🏆</div>
              <h2 className="font-semibold">ランキング</h2>
              <p className="mt-1 text-sm text-slate-600">順位・ビンゴ数を確認</p>
            </div>
          </Link>
        )}
      </div>

      {event?.status === "draft" && (
        <p className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
          ゲーム開始をお待ちください。プロフィールと質問への回答を登録しておきましょう。
        </p>
      )}
    </PageShell>
  );
}
