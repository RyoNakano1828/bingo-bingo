import { NextRequest, NextResponse } from "next/server";
import { getAdminToken, verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withApi } from "@/lib/with-api";

type RouteParams = { params: Promise<{ eventId: string }> };

export const GET = withApi(async (request: NextRequest, { params }: RouteParams) => {
  const { eventId } = await params;
  const token = getAdminToken(request);
  const isAdmin = !!(await verifyAdmin(eventId, token));

  const users = await prisma.user.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { answers: true } },
    },
  });

  const questionCount = await prisma.question.count({ where: { eventId } });

  return NextResponse.json(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      iconUrl: user.iconUrl,
      profile: isAdmin ? user.profile : undefined,
      groupId: user.groupId,
      answerCount: user._count.answers,
      totalQuestions: questionCount,
      answersComplete: user._count.answers >= questionCount && questionCount > 0,
    }))
  );
});

export const POST = withApi(async (request: NextRequest, { params }: RouteParams) => {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  if (event.status !== "draft") {
    return NextResponse.json(
      { error: "ゲーム開始後は新規登録できません" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      eventId,
      name,
      iconUrl: body.iconUrl?.trim() || null,
      profile: body.profile?.trim() || null,
      groupId: body.groupId?.trim() || null,
    },
  });

  return NextResponse.json(user);
});
