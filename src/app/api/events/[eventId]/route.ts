import { NextRequest, NextResponse } from "next/server";
import { getAdminToken, verifyAdmin } from "@/lib/auth";
import { getEventInfo } from "@/lib/event-service";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ eventId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { eventId } = await params;
  const event = await getEventInfo(eventId);

  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(event, {
    headers: {
      "Cache-Control": "private, max-age=5, stale-while-revalidate=30",
    },
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { eventId } = await params;
  const token = getAdminToken(request);
  const event = await verifyAdmin(eventId, token);

  if (!event) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const body = await request.json();
  const data: {
    title?: string;
    status?: string;
    excludeSelf?: boolean;
    startedAt?: Date | null;
  } = {};

  if (body.title !== undefined) data.title = body.title.trim();
  if (body.status !== undefined) data.status = body.status;
  if (body.excludeSelf !== undefined) data.excludeSelf = body.excludeSelf;
  if (body.startedAt !== undefined) {
    data.startedAt = body.startedAt ? new Date(body.startedAt) : null;
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data,
  });

  return NextResponse.json(updated);
}
