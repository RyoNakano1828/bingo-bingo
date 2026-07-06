const MAX_ICON_URL_LENGTH = 300_000;

export function normalizeIconUrl(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  if (trimmed.length > MAX_ICON_URL_LENGTH) {
    throw new Error("画像データが大きすぎます");
  }

  if (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  throw new Error("アイコンは画像URLまたはアップロード画像を指定してください");
}
