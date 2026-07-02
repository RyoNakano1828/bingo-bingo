import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateJoinCode } from "@/lib/game";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
  }

  let joinCode = generateJoinCode();
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.event.findUnique({ where: { joinCode } });
    if (!existing) break;
    joinCode = generateJoinCode();
  }

  const event = await prisma.event.create({
    data: {
      title,
      joinCode,
      excludeSelf: body.excludeSelf !== false,
    },
  });

  return NextResponse.json({
    id: event.id,
    title: event.title,
    joinCode: event.joinCode,
    adminToken: event.adminToken,
    status: event.status,
  });
}

export async function GET(request: NextRequest) {
  const joinCode = request.nextUrl.searchParams.get("joinCode");

  if (joinCode) {
    const event = await prisma.event.findUnique({ where: { joinCode } });
    if (!event) {
      return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
    }
    return NextResponse.json({
      id: event.id,
      title: event.title,
      status: event.status,
      joinCode: event.joinCode,
    });
  }

  return NextResponse.json({ error: "joinCode が必要です" }, { status: 400 });
}
