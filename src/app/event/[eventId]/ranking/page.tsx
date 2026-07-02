"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { RankingTable } from "@/components/RankingTable";
import { EventInfo, apiFetch, getParticipantSession } from "@/lib/api-client";

export default function RankingPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const session = getParticipantSession();

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [rankings, setRankings] = useState<
    {
      rank: number;
      name: string;
      openedCount: number;
      bingoCount: number;
      clearTimeMs: number | null;
    }[]
  >([]);

  useEffect(() => {
    async function load() {
      const data = await apiFetch<{
        event: EventInfo;
        rankings: typeof rankings;
      }>(`/api/events/${eventId}/rankings`);
      setEvent(data.event);
      setRankings(data.rankings);
    }
    load();
  }, [eventId]);

  const backHref =
    session?.eventId === eventId
      ? `/event/${eventId}/home`
      : `/admin/events/${eventId}`;

  return (
    <PageShell title="ランキング" subtitle={event?.title} backHref={backHref}>
      <RankingTable rankings={rankings} />
    </PageShell>
  );
}
