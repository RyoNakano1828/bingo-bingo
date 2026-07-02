import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getCompletedLines, isAnswerCorrect } from "@/lib/game";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ eventId: string; userId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { eventId, userId } = await params;
  const requestUserId = getUserId(request);

  if (requestUserId !== userId) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  const card = await prisma.bingoCard.findUnique({
    where: { userId },
    include: {
      cells: {
        orderBy: { position: "asc" },
        include: {
          targetUser: { select: { id: true, name: true, iconUrl: true } },
          question: { select: { id: true, text: true } },
        },
      },
    },
  });

  if (!card) {
    return NextResponse.json(
      { error: "ビンゴカードがまだ生成されていません" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    cardId: card.id,
    bingoCount: card.bingoCount,
    firstBingoAt: card.firstBingoAt,
    eventStatus: event.status,
    cells: card.cells.map((cell) => ({
      id: cell.id,
      position: cell.position,
      opened: cell.opened,
      targetUser: cell.targetUser,
      question: cell.opened ? cell.question : undefined,
    })),
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { eventId, userId } = await params;
  const requestUserId = getUserId(request);

  if (requestUserId !== userId) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "active") {
    return NextResponse.json(
      { error: "ゲームが進行中ではありません" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const cellId = body.cellId;
  const submittedAnswer = body.answer?.trim();

  if (!cellId || !submittedAnswer) {
    return NextResponse.json(
      { error: "cellId と answer が必要です" },
      { status: 400 }
    );
  }

  const card = await prisma.bingoCard.findUnique({
    where: { userId },
    include: {
      cells: {
        where: { id: cellId },
        include: {
          question: true,
        },
      },
    },
  });

  if (!card || card.cells.length === 0) {
    return NextResponse.json({ error: "マスが見つかりません" }, { status: 404 });
  }

  const cell = card.cells[0];

  if (cell.opened) {
    return NextResponse.json({ error: "すでに開いているマスです" }, { status: 400 });
  }

  const correctAnswer = await prisma.userAnswer.findUnique({
    where: {
      userId_questionId: {
        userId: cell.targetUserId,
        questionId: cell.questionId,
      },
    },
  });

  if (!correctAnswer) {
    return NextResponse.json(
      { error: "相手の回答が登録されていません" },
      { status: 400 }
    );
  }

  const correct = isAnswerCorrect(submittedAnswer, correctAnswer.answer);

  if (!correct) {
    return NextResponse.json({
      correct: false,
      message: "不正解です。もう一度聞いてみましょう！",
    });
  }

  await prisma.bingoCell.update({
    where: { id: cellId },
    data: { opened: true },
  });

  const allCells = await prisma.bingoCell.findMany({
    where: { cardId: card.id },
  });

  const openedPositions = new Set(
    allCells.filter((c) => c.opened || c.id === cellId).map((c) => c.position)
  );

  const completedLines = getCompletedLines(openedPositions);
  const previousLines: number[] = JSON.parse(card.completedLines);
  const previousSet = new Set(previousLines);
  const newLines = completedLines.filter((line) => !previousSet.has(line));
  const newBingoCount = completedLines.length;

  let firstBingoAt = card.firstBingoAt;
  if (newLines.length > 0 && !firstBingoAt) {
    firstBingoAt = new Date();
  }

  await prisma.bingoCard.update({
    where: { id: card.id },
    data: {
      bingoCount: newBingoCount,
      firstBingoAt,
      completedLines: JSON.stringify(completedLines),
    },
  });

  return NextResponse.json({
    correct: true,
    opened: true,
    newBingoLines: newLines.length,
    bingoCount: newBingoCount,
    firstBingo: newLines.length > 0 && !card.firstBingoAt,
  });
}
