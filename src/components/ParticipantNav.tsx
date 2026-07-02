"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEvent } from "@/contexts/EventContext";

type Props = {
  eventId: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  match: (path: string) => boolean;
  disabled?: boolean;
  highlight?: boolean;
};

export function ParticipantNav({ eventId }: Props) {
  const pathname = usePathname();
  const { gameStarted } = useEvent();

  const items: NavItem[] = [
    {
      href: `/event/${eventId}/home`,
      label: "ホーム",
      icon: "🏠",
      match: (p) => p.endsWith("/home"),
    },
    {
      href: `/event/${eventId}/answers`,
      label: "回答",
      icon: "✏️",
      match: (p) => p.endsWith("/answers"),
    },
    {
      href: `/event/${eventId}/card`,
      label: "ビンゴ",
      icon: "🎯",
      match: (p) => p.endsWith("/card"),
      disabled: !gameStarted,
      highlight: gameStarted,
    },
    {
      href: `/event/${eventId}/ranking`,
      label: "順位",
      icon: "🏆",
      match: (p) => p.endsWith("/ranking"),
      disabled: !gameStarted,
    },
    {
      href: `/event/${eventId}/profile`,
      label: "プロフィール",
      icon: "👤",
      match: (p) => p.endsWith("/profile"),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = item.match(pathname);
          const disabled = item.disabled;

          if (disabled) {
            return (
              <span
                key={item.href}
                className="flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] text-slate-300"
                title="ゲーム開始後に利用できます"
              >
                <span className="text-lg opacity-40">{item.icon}</span>
                <span>{item.label}</span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] transition ${
                item.highlight && !active
                  ? "text-indigo-600"
                  : active
                    ? "font-semibold text-indigo-600"
                    : "text-slate-500 hover:text-indigo-600"
              }`}
            >
              <span
                className={`text-lg leading-none ${
                  item.highlight
                    ? "flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-xl text-white shadow-md"
                    : ""
                }`}
              >
                {item.icon}
              </span>
              <span className={item.highlight ? "font-semibold" : ""}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
