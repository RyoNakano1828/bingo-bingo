import { NextResponse } from "next/server";
import { getRankingsForEvent } from "@/lib/bingo-service";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  const rankings = await getRankingsForEvent(eventId);
  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      status: event.status,
      startedAt: event.startedAt,
    },
    rankings,
  });
}
