import { NextRequest, NextResponse } from "next/server";
import { getAdminToken, verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ eventId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { eventId } = await params;
  const questions = await prisma.question.findMany({
    where: { eventId },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(questions);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { eventId } = await params;
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

  const question = await prisma.question.create({
    data: { eventId, text },
  });

  return NextResponse.json(question);
}
