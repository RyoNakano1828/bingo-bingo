import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { normalizeIconUrl } from "@/lib/icon-url";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ eventId: string; userId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { eventId, userId } = await params;

  const user = await prisma.user.findFirst({
    where: { id: userId, eventId },
  });

  if (!user) {
    return NextResponse.json({ error: "参加者が見つかりません" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    iconUrl: user.iconUrl,
    profile: user.profile,
    groupId: user.groupId,
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { eventId, userId } = await params;
  const requestUserId = getUserId(request);

  if (requestUserId !== userId) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "draft") {
    return NextResponse.json(
      { error: "ゲーム開始後はプロフィールを編集できません" },
      { status: 400 }
    );
  }

  const body = await request.json();

  let iconUrl: string | null | undefined = undefined;
  if (body.iconUrl !== undefined) {
    try {
      iconUrl = normalizeIconUrl(body.iconUrl);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "画像が不正です" },
        { status: 400 }
      );
    }
  }

  const user = await prisma.user.update({
    where: { id: userId, eventId },
    data: {
      name: body.name?.trim() || undefined,
      iconUrl,
      profile: body.profile !== undefined ? body.profile?.trim() || null : undefined,
      groupId: body.groupId !== undefined ? body.groupId?.trim() || null : undefined,
    },
  });

  return NextResponse.json(user);
}
