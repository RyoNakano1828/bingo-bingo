import { prisma } from "@/lib/db";
import { EventInfo } from "@/lib/api-client";

export async function getEventInfo(eventId: string): Promise<EventInfo | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: { select: { users: true, questions: true } },
    },
  });

  if (!event) return null;

  return {
    id: event.id,
    title: event.title,
    status: event.status,
    joinCode: event.joinCode,
    excludeSelf: event.excludeSelf,
    startedAt: event.startedAt?.toISOString() ?? null,
    userCount: event._count.users,
    questionCount: event._count.questions,
  };
}
