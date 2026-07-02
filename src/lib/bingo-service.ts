import { prisma } from "./db";
import { pickQuestionId, shuffleArray } from "./game";

const CARD_SIZE = 16;

export async function generateBingoCards(eventId: string, excludeSelf: boolean) {
  const [users, questions] = await Promise.all([
    prisma.user.findMany({ where: { eventId } }),
    prisma.question.findMany({ where: { eventId } }),
  ]);

  if (users.length < CARD_SIZE) {
    throw new Error(
      `参加者は${CARD_SIZE}人以上必要です（現在: ${users.length}人）`
    );
  }

  if (questions.length === 0) {
    throw new Error("質問が1つ以上必要です");
  }

  const questionIds = questions.map((q) => q.id);

  await prisma.bingoCard.deleteMany({
    where: { user: { eventId } },
  });

  for (const user of users) {
    const candidates = excludeSelf
      ? users.filter((u) => u.id !== user.id)
      : users;

    if (candidates.length < CARD_SIZE) {
      throw new Error(
        `${user.name} のカード生成に必要な参加者が不足しています`
      );
    }

    const targets = shuffleArray(candidates).slice(0, CARD_SIZE);
    const card = await prisma.bingoCard.create({
      data: { userId: user.id },
    });

    const usedQuestionsPerTarget = new Map<string, Set<string>>();

    for (let position = 0; position < CARD_SIZE; position++) {
      const target = targets[position];
      const used = usedQuestionsPerTarget.get(target.id) ?? new Set<string>();
      const questionId = pickQuestionId(questionIds, used);
      used.add(questionId);
      usedQuestionsPerTarget.set(target.id, used);

      await prisma.bingoCell.create({
        data: {
          cardId: card.id,
          position,
          targetUserId: target.id,
          questionId,
        },
      });
    }
  }
}

export async function getRankingsForEvent(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;

  const cards = await prisma.bingoCard.findMany({
    where: { user: { eventId } },
    include: {
      user: true,
      cells: { select: { opened: true } },
    },
  });

  const entries = cards.map((card) => ({
    userId: card.userId,
    name: card.user.name,
    openedCount: card.cells.filter((c) => c.opened).length,
    bingoCount: card.bingoCount,
    firstBingoAt: card.firstBingoAt,
    gameStartedAt: event.startedAt,
  }));

  const { buildRankings } = await import("./game");
  return buildRankings(entries);
}
