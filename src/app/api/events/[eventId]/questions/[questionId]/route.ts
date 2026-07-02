import { NextRequest, NextResponse } from "next/server";
import { getAdminToken, verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ eventId: string; questionId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { eventId, questionId } = await params;
  const token = getAdminToken(request);
  const event = await verifyAdmin(eventId, token);

  if (!event) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const body = await request.json();
  const text = body.text?.trim();

  if (!text) {
    return NextResponse.json({ error: "質問文は必須です" }, { status: 400 });
  }

  const question = await prisma.question.update({
    where: { id: questionId, eventId },
    data: { text },
  });

  return NextResponse.json(question);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { eventId, questionId } = await params;
  const token = getAdminToken(request);
  const event = await verifyAdmin(eventId, token);

  if (!event) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  await prisma.question.delete({
    where: { id: questionId, eventId },
  });

  return NextResponse.json({ success: true });
}
