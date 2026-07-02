"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EventInfo, apiFetch } from "@/lib/api-client";

type EventContextValue = {
  event: EventInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  gameStarted: boolean;
};

const EventContext = createContext<EventContextValue | null>(null);

type Props = {
  eventId: string;
  initialEvent?: EventInfo | null;
  children: React.ReactNode;
};

export function EventProvider({ eventId, initialEvent, children }: Props) {
  const [event, setEvent] = useState<EventInfo | null>(initialEvent ?? null);
  const [loading, setLoading] = useState(!initialEvent);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<EventInfo>(`/api/events/${eventId}`, {
        cacheTtlMs: 0,
      });
      setEvent(data);
    } catch {
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!initialEvent) {
      refresh();
    }
  }, [initialEvent, refresh]);

  useEffect(() => {
    if (event?.status !== "draft") return;

    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [event?.status, refresh]);

  const value = useMemo(
    () => ({
      event,
      loading,
      refresh,
      gameStarted: event?.status === "active" || event?.status === "finished",
    }),
    [event, loading, refresh]
  );

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
}

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) {
    throw new Error("useEvent must be used within EventProvider");
  }
  return ctx;
}

export function useOptionalEvent() {
  return useContext(EventContext);
}
