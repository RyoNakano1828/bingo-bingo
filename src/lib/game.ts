const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)];
  }
  return code;
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

export function isAnswerCorrect(
  submitted: string,
  correct: string
): boolean {
  return normalizeAnswer(submitted) === normalizeAnswer(correct);
}

export const BINGO_LINES: number[][] = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];

export function getCompletedLines(openedPositions: Set<number>): number[] {
  const completed: number[] = [];
  BINGO_LINES.forEach((line, index) => {
    if (line.every((pos) => openedPositions.has(pos))) {
      completed.push(index);
    }
  });
  return completed;
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickQuestionId(
  questionIds: string[],
  usedQuestionIds: Set<string>
): string {
  const unused = questionIds.filter((id) => !usedQuestionIds.has(id));
  const pool = unused.length > 0 ? unused : questionIds;
  return pool[Math.floor(Math.random() * pool.length)];
}

export type RankingEntry = {
  rank: number;
  userId: string;
  name: string;
  openedCount: number;
  bingoCount: number;
  clearTimeMs: number | null;
};

export function buildRankings(
  entries: {
    userId: string;
    name: string;
    openedCount: number;
    bingoCount: number;
    firstBingoAt: Date | null;
    gameStartedAt: Date | null;
  }[]
): RankingEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.bingoCount !== a.bingoCount) return b.bingoCount - a.bingoCount;
    if (b.openedCount !== a.openedCount) return b.openedCount - a.openedCount;
    const aTime = a.firstBingoAt?.getTime() ?? Infinity;
    const bTime = b.firstBingoAt?.getTime() ?? Infinity;
    return aTime - bTime;
  });

  return sorted.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    name: entry.name,
    openedCount: entry.openedCount,
    bingoCount: entry.bingoCount,
    clearTimeMs:
      entry.firstBingoAt && entry.gameStartedAt
        ? entry.firstBingoAt.getTime() - entry.gameStartedAt.getTime()
        : null,
  }));
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "-";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
