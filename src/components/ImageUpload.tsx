"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Input } from "@/components/Input";
import { resizeImageFile } from "@/lib/image-utils";

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
};

export function ImageUpload({
  label = "プロフィール画像",
  value,
  onChange,
  name,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [showUrl, setShowUrl] = useState(
    Boolean(value && !value.startsWith("data:image/"))
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    try {
      const dataUrl = await resizeImageFile(file);
      onChange(dataUrl);
      setShowUrl(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像の処理に失敗しました");
    }
  }

  return (
    <div className="space-y-3">
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}

      <div className="flex items-center gap-4">
        <Avatar name={name || "?"} iconUrl={value || null} size="lg" />
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled}
            onChange={handleFileChange}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            画像をアップロード
          </button>
          {!disabled && value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-left text-xs text-slate-500 hover:text-red-600"
            >
              画像を削除
            </button>
          )}
        </div>
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={() => setShowUrl((v) => !v)}
          className="text-xs text-indigo-600 hover:underline"
        >
          {showUrl ? "URL入力を閉じる" : "URLで指定する"}
        </button>
      )}

      {showUrl && (
        <Input
          label="画像URL"
          placeholder="https://..."
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
