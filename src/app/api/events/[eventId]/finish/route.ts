import { NextRequest, NextResponse } from "next/server";
import { getAdminToken, verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ eventId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { eventId } = await params;
  const token = getAdminToken(request);
  const event = await verifyAdmin(eventId, token);

  if (!event) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status: "finished" },
  });

  return NextResponse.json({ success: true, event: updated });
}
