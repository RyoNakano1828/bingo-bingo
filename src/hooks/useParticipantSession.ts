"use client";

import { useMemo } from "react";
import { getParticipantSession } from "@/lib/api-client";

/** レンダーごとに新しいオブジェクトが作られないよう、初回読み込み結果を保持する */
export function useParticipantSession() {
  return useMemo(() => getParticipantSession(), []);
}
