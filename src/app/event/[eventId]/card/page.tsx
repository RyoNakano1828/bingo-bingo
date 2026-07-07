"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Avatar } from "@/components/Avatar";
import { Input } from "@/components/Input";
import { PageShell } from "@/components/PageShell";
import { apiFetch } from "@/lib/api-client";
import { useParticipantSession } from "@/hooks/useParticipantSession";

type Cell = {
  id: string;
  position: number;
  opened: boolean;
  targetUser: { id: string; name: string; iconUrl: string | null };
};

type CardData = {
  bingoCount: number;
  cells: Cell[];
};

type CellQuestion = {
  cellId: string;
  targetUser: { name: string };
  question: { text: string };
};

export default function BingoCardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const session = useParticipantSession();

  const [card, setCard] = useState<CardData | null>(null);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [question, setQuestion] = useState<CellQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bingoFlash, setBingoFlash] = useState(false);

  async function loadCard() {
    if (!session) return;
    const data = await apiFetch<CardData>(
      `/api/events/${eventId}/users/${session.userId}/card`,
      { userId: session.userId }
    );
    setCard(data);
  }

  useEffect(() => {
    if (!session || session.eventId !== eventId) {
      router.replace(`/join/${eventId}`);
      return;
    }
    loadCard().catch((err) => {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, router, session]);

  async function handleCellTap(cell: Cell) {
    if (cell.opened || !session) return;
    setError("");
    setFeedback("");
    setAnswer("");
    setSelectedCell(cell);
    try {
      const data = await apiFetch<CellQuestion>(
        `/api/events/${eventId}/users/${session.userId}/card/cells/${cell.id}`,
        { userId: session.userId }
      );
      setQuestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "質問の取得に失敗しました");
      setSelectedCell(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !selectedCell) return;
    setSubmitting(true);
    setFeedback("");
    setError("");
    try {
      const result = await apiFetch<{
        correct: boolean;
        message?: string;
        newBingoLines?: number;
        firstBingo?: boolean;
      }>(`/api/events/${eventId}/users/${session.userId}/card`, {
        method: "POST",
        userId: session.userId,
        body: JSON.stringify({ cellId: selectedCell.id, answer }),
      });

      if (!result.correct) {
        setFeedback(result.message ?? "不正解です");
        setSubmitting(false);
        return;
      }

      setFeedback("正解！マスが開きました 🎉");
      if (result.firstBingo) {
        setBingoFlash(true);
        setTimeout(() => setBingoFlash(false), 3000);
      }
      setSelectedCell(null);
      setQuestion(null);
      setAnswer("");
      await loadCard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  function closeDialog() {
    setSelectedCell(null);
    setQuestion(null);
    setAnswer("");
    setFeedback("");
  }

  if (!session) return null;

  return (
    <PageShell
      title="ビンゴカード"
      subtitle={
        card
          ? `ビンゴ数: ${card.bingoCount} / 開いたマス: ${card.cells.filter((c) => c.opened).length} / 16`
          : undefined
      }
      backHref={`/event/${eventId}/home`}
    >
      {bingoFlash && (
        <div className="mb-4 animate-pulse rounded-xl bg-amber-100 px-4 py-6 text-center text-lg font-bold text-amber-800">
          🎉 ビンゴ成立！ 🎉
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!card ? (
        <p className="text-slate-500">カードを読み込んでいます...</p>
      ) : (
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-2.5">
          {card.cells.map((cell) => (
            <button
              key={cell.id}
              type="button"
              onClick={() => handleCellTap(cell)}
              disabled={cell.opened}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 p-1.5 text-center transition ${
                cell.opened
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : "border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 active:scale-95"
              }`}
            >
              <Avatar
                name={cell.targetUser.name}
                iconUrl={cell.targetUser.iconUrl}
                size="lg"
                className="mb-0.5"
              />
              <span className="line-clamp-1 text-[10px] font-medium leading-tight">
                {cell.targetUser.name}
              </span>
              {cell.opened && <span className="mt-0.5 text-[10px]">✓</span>}
            </button>
          ))}
        </div>
      )}

      <p className="mx-auto mt-6 max-w-md text-center text-sm text-slate-500">
        マスをタップ → 本人を探して質問 → 回答を入力
      </p>

      {selectedCell && question && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {question.targetUser.name} さんへの質問
            </h3>
            <p className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-900">
              Q. {question.question.text}
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <Input
                label="回答"
                placeholder="本人から聞いた答えを入力"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
                autoFocus
              />
              {feedback && (
                <p
                  className={`rounded-lg px-3 py-2 text-sm ${
                    feedback.startsWith("正解")
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {feedback}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={closeDialog}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? "判定中..." : "回答する"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
