import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ eventId: string; userId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { eventId, userId } = await params;
  const requestUserId = getUserId(_request);

  if (requestUserId !== userId) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const questions = await prisma.question.findMany({
    where: { eventId },
    orderBy: { id: "asc" },
  });

  const answers = await prisma.userAnswer.findMany({
    where: { userId },
  });

  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

  return NextResponse.json(
    questions.map((q) => ({
      id: q.id,
      text: q.text,
      answer: answerMap.get(q.id) ?? "",
    }))
  );
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { eventId, userId } = await params;
  const requestUserId = getUserId(request);

  if (requestUserId !== userId) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "draft") {
    return NextResponse.json(
      { error: "ゲーム開始後は回答を編集できません" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const answers: { questionId: string; answer: string }[] = body.answers ?? [];

  for (const item of answers) {
    const answer = item.answer?.trim();
    if (!answer) continue;

    await prisma.userAnswer.upsert({
      where: {
        userId_questionId: {
          userId,
          questionId: item.questionId,
        },
      },
      create: {
        userId,
        questionId: item.questionId,
        answer,
      },
      update: { answer },
    });
  }

  return NextResponse.json({ success: true });
}
