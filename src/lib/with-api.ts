import { NextResponse } from "next/server";

export function withApi<
  T extends (...args: never[]) => Promise<Response>,
>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("[API Error]", error);
      const message =
        error instanceof Error
          ? error.message
          : "サーバーエラーが発生しました";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }) as T;
}
