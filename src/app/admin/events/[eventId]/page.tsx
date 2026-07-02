"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PageShell } from "@/components/PageShell";
import { RankingTable } from "@/components/RankingTable";
import {
  EventInfo,
  apiFetch,
  getAdminToken,
  invalidateApiCache,
} from "@/lib/api-client";

type Question = { id: string; text: string };
type UserRow = {
  id: string;
  name: string;
  answerCount: number;
  totalQuestions: number;
  answersComplete: boolean;
};

export default function AdminEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const adminToken = getAdminToken(eventId);

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [rankings, setRankings] = useState<
    {
      rank: number;
      name: string;
      openedCount: number;
      bingoCount: number;
      clearTimeMs: number | null;
    }[]
  >([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    if (!adminToken) {
      setError("管理者トークンがありません。再度ログインしてください。");
      setLoading(false);
      return;
    }

    try {
      const [eventData, questionData, userData, rankingData] = await Promise.all([
        apiFetch<EventInfo>(`/api/events/${eventId}`, { adminToken }),
        apiFetch<Question[]>(`/api/events/${eventId}/questions`, { adminToken }),
        apiFetch<UserRow[]>(`/api/events/${eventId}/users`, { adminToken }),
        apiFetch<{ rankings: typeof rankings }>(
          `/api/events/${eventId}/rankings`,
          { adminToken }
        ),
      ]);
      setEvent(eventData);
      setEditTitle(eventData.title);
      setQuestions(questionData);
      setUsers(userData);
      setRankings(rankingData.rankings);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken) return;
    try {
      await apiFetch(`/api/events/${eventId}/questions`, {
        method: "POST",
        adminToken,
        body: JSON.stringify({ text: newQuestion }),
      });
      setNewQuestion("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!adminToken || !confirm("この質問を削除しますか？")) return;
    await apiFetch(`/api/events/${eventId}/questions/${questionId}`, {
      method: "DELETE",
      adminToken,
    });
    await loadAll();
  }

  async function handleUpdateTitle(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken) return;
    await apiFetch(`/api/events/${eventId}`, {
      method: "PATCH",
      adminToken,
      body: JSON.stringify({ title: editTitle }),
    });
    setMessage("イベント名を更新しました");
    await loadAll();
  }

  async function handleStartGame(force = false) {
    if (!adminToken) return;
    if (
      !force &&
      !confirm("ゲームを開始しますか？全参加者のビンゴカードが生成されます。")
    ) {
      return;
    }
    try {
      const url = force
        ? `/api/events/${eventId}/start?force=1`
        : `/api/events/${eventId}/start`;
      await apiFetch(url, { method: "POST", adminToken });
      invalidateApiCache(`/api/events/${eventId}`);
      setMessage("ゲームを開始しました！");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "開始に失敗しました");
    }
  }

  async function handleFinishGame() {
    if (!adminToken || !confirm("ゲームを終了しますか？")) return;
    await apiFetch(`/api/events/${eventId}/finish`, {
      method: "POST",
      adminToken,
    });
    invalidateApiCache(`/api/events/${eventId}`);
    setMessage("ゲームを終了しました");
    await loadAll();
  }

  if (loading) {
    return (
      <PageShell title="読み込み中..." backHref="/admin">
        <p className="text-slate-500">データを読み込んでいます...</p>
      </PageShell>
    );
  }

  if (!event) {
    return (
      <PageShell title="エラー" backHref="/admin">
        <p className="text-red-600">{error || "イベントが見つかりません"}</p>
      </PageShell>
    );
  }

  const statusLabel =
    event.status === "draft"
      ? "準備中"
      : event.status === "active"
        ? "進行中"
        : "終了";

  return (
    <PageShell
      title={event.title}
      subtitle={`参加コード: ${event.joinCode} / 状態: ${statusLabel}`}
      backHref="/admin"
      actions={
        <Link href={`/event/${eventId}/ranking`}>
          <Button variant="secondary" size="sm">
            ランキング
          </Button>
        </Link>
      }
    >
      {message && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">イベント設定</h2>
            <form onSubmit={handleUpdateTitle} className="space-y-3">
              <Input
                label="イベント名"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <Button type="submit" variant="secondary" size="sm">
                名前を更新
              </Button>
            </form>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">参加者</dt>
                <dd className="font-semibold">{event.userCount ?? 0} 人</dd>
              </div>
              <div>
                <dt className="text-slate-500">質問数</dt>
                <dd className="font-semibold">{event.questionCount ?? 0} 件</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {event.status === "draft" && (
                <Button onClick={() => handleStartGame()}>ゲーム開始</Button>
              )}
              {event.status === "active" && (
                <Button variant="danger" onClick={handleFinishGame}>
                  ゲーム終了
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              ※ ビンゴカード生成には参加者16人以上が必要です
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">質問管理</h2>
            <form onSubmit={handleAddQuestion} className="mb-4 flex gap-2">
              <Input
                placeholder="例: 好きな食べ物"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                required
              />
              <Button type="submit" size="sm">
                追加
              </Button>
            </form>
            <ul className="space-y-2">
              {questions.map((q) => (
                <li
                  key={q.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>{q.text}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteQuestion(q.id)}
                  >
                    削除
                  </Button>
                </li>
              ))}
              {questions.length === 0 && (
                <li className="text-sm text-slate-500">質問がありません</li>
              )}
            </ul>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">参加者一覧</h2>
            <ul className="space-y-2">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{user.name}</span>
                  <span
                    className={
                      user.answersComplete
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }
                  >
                    {user.answerCount}/{user.totalQuestions} 回答
                  </span>
                </li>
              ))}
              {users.length === 0 && (
                <li className="text-sm text-slate-500">参加者がいません</li>
              )}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">ランキング</h2>
            <RankingTable rankings={rankings} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
