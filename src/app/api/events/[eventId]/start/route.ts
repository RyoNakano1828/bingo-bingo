import { NextRequest, NextResponse } from "next/server";
import { getAdminToken, verifyAdmin } from "@/lib/auth";
import { generateBingoCards } from "@/lib/bingo-service";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ eventId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { eventId } = await params;
  const token = getAdminToken(request);
  const event = await verifyAdmin(eventId, token);

  if (!event) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  if (event.status === "active") {
    return NextResponse.json({ error: "すでにゲーム中です" }, { status: 400 });
  }

  const users = await prisma.user.findMany({ where: { eventId } });
  const questions = await prisma.question.findMany({ where: { eventId } });

  const unansweredUsers = [];
  for (const user of users) {
    const answerCount = await prisma.userAnswer.count({
      where: { userId: user.id },
    });
    if (answerCount < questions.length) {
      unansweredUsers.push(user.name);
    }
  }

  if (unansweredUsers.length > 0 && !request.nextUrl.searchParams.get("force")) {
    return NextResponse.json(
      {
        error: "未回答の参加者がいます",
        unansweredUsers,
      },
      { status: 400 }
    );
  }

  try {
    await generateBingoCards(eventId, event.excludeSelf);
  } catch (error) {
    const message = error instanceof Error ? error.message : "カード生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status: "active", startedAt: new Date() },
  });

  return NextResponse.json({ success: true, event: updated });
}
