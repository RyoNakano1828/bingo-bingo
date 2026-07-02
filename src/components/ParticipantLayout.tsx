"use client";

import { EventProvider } from "@/contexts/EventContext";
import { ParticipantNav } from "@/components/ParticipantNav";
import { EventInfo } from "@/lib/api-client";

type Props = {
  eventId: string;
  initialEvent?: EventInfo | null;
  children: React.ReactNode;
};

export function ParticipantLayout({ eventId, initialEvent, children }: Props) {
  return (
    <EventProvider eventId={eventId} initialEvent={initialEvent}>
      <div className="pb-24">{children}</div>
      <ParticipantNav eventId={eventId} />
    </EventProvider>
  );
}
