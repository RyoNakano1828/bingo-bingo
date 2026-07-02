"use client";

import { Suspense } from "react";
import JoinPageContent from "./JoinPageContent";

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">読み込み中...</div>}>
      <JoinPageContent />
    </Suspense>
  );
}
