import { notFound } from "next/navigation";
import { ParticipantLayout } from "@/components/ParticipantLayout";
import { getEventInfo } from "@/lib/event-service";

type Props = {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
};

export default async function EventLayout({ children, params }: Props) {
  const { eventId } = await params;
  const event = await getEventInfo(eventId);

  if (!event) {
    notFound();
  }

  return (
    <ParticipantLayout eventId={eventId} initialEvent={event}>
      {children}
    </ParticipantLayout>
  );
}
