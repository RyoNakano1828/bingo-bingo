import { NextRequest } from "next/server";
import { prisma } from "./db";

export async function verifyAdmin(eventId: string, token: string | null) {
  if (!token) return null;
  const event = await prisma.event.findFirst({
    where: { id: eventId, adminToken: token },
  });
  return event;
}

export function getAdminToken(request: NextRequest): string | null {
  return request.headers.get("x-admin-token");
}

export function getUserId(request: NextRequest): string | null {
  return request.headers.get("x-user-id");
}
