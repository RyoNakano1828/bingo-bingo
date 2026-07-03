export async function apiFetch<T>(
  url: string,
  options: RequestInit & {
    adminToken?: string;
    userId?: string;
    cacheTtlMs?: number;
  } = {}
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const cacheTtlMs = options.cacheTtlMs ?? (method === "GET" ? 5000 : 0);
  const cacheKey =
    method === "GET"
      ? `${url}|${options.adminToken ?? ""}|${options.userId ?? ""}`
      : null;

  if (cacheKey && cacheTtlMs > 0) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
    const inflight = inflightRequests.get(cacheKey);
    if (inflight) {
      return inflight as Promise<T>;
    }
  }

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.adminToken) headers.set("x-admin-token", options.adminToken);
  if (options.userId) headers.set("x-user-id", options.userId);

  const request = (async () => {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data: { error?: string } = {};
    if (text) {
      try {
        data = JSON.parse(text) as { error?: string };
      } catch {
        if (!response.ok) {
          throw new Error(
            `サーバーエラー (${response.status}): 応答を読み取れませんでした`
          );
        }
      }
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          (response.status === 500
            ? "サーバーに接続できません。DATABASE_URL の設定を確認してください。"
            : "リクエストに失敗しました")
      );
    }

    if (!text) {
      throw new Error("サーバーから空の応答が返されました");
    }

    const parsed = JSON.parse(text);

    if (cacheKey && cacheTtlMs > 0) {
      responseCache.set(cacheKey, {
        data: parsed,
        expiresAt: Date.now() + cacheTtlMs,
      });
    }

    return parsed as T;
  })();

  if (cacheKey && cacheTtlMs > 0) {
    inflightRequests.set(cacheKey, request);
    request.finally(() => inflightRequests.delete(cacheKey));
  }

  return request;
}

export function invalidateApiCache(urlPrefix?: string) {
  if (!urlPrefix) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.startsWith(urlPrefix)) {
      responseCache.delete(key);
    }
  }
}

type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<unknown>>();

export type EventInfo = {
  id: string;
  title: string;
  status: string;
  joinCode: string;
  excludeSelf?: boolean;
  startedAt?: string | null;
  userCount?: number;
  questionCount?: number;
};

export type ParticipantSession = {
  eventId: string;
  userId: string;
  name: string;
};

const SESSION_KEY = "quiz_bingo_session";
const ADMIN_KEY = "quiz_bingo_admin";

export function saveParticipantSession(session: ParticipantSession) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function getParticipantSession(): ParticipantSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParticipantSession;
  } catch {
    return null;
  }
}

export function clearParticipantSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function saveAdminToken(eventId: string, token: string) {
  if (typeof window !== "undefined") {
    const data = getAdminTokens();
    data[eventId] = token;
    localStorage.setItem(ADMIN_KEY, JSON.stringify(data));
  }
}

export function getAdminToken(eventId: string): string | null {
  if (typeof window === "undefined") return null;
  const data = getAdminTokens();
  return data[eventId] ?? null;
}

function getAdminTokens(): Record<string, string> {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}
