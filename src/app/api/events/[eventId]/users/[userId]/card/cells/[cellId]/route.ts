import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = {
  params: Promise<{ eventId: string; userId: string; cellId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { eventId, userId, cellId } = await params;
  const requestUserId = getUserId(request);

  if (requestUserId !== userId) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const cell = await prisma.bingoCell.findFirst({
    where: {
      id: cellId,
      card: { userId, user: { eventId } },
    },
    include: {
      targetUser: { select: { id: true, name: true, iconUrl: true } },
      question: { select: { id: true, text: true } },
    },
  });

  if (!cell) {
    return NextResponse.json({ error: "マスが見つかりません" }, { status: 404 });
  }

  if (cell.opened) {
    return NextResponse.json({ error: "すでに開いているマスです" }, { status: 400 });
  }

  return NextResponse.json({
    cellId: cell.id,
    targetUser: cell.targetUser,
    question: cell.question,
  });
}
