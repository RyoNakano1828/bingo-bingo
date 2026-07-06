const MAX_ICON_BYTES = 300_000;

export async function resizeImageFile(
  file: File,
  maxPx = 256,
  quality = 0.85
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイルを選択してください");
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("画像の処理に失敗しました"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length > MAX_ICON_BYTES) {
        reject(new Error("画像が大きすぎます。別の画像を選んでください"));
        return;
      }
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました"));
    };

    img.src = objectUrl;
  });
}
