import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const BUCKET = "community-images";
const MAX_WIDTH = 1200;
const QUALITY = 0.8;

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Comprime imagem no browser (max 1200px, WebP 0.8). */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha na compressão"))),
      "image/webp",
      QUALITY,
    );
  });
}

/** Upload para Supabase Storage. Path: `{userId}/{uuid}.webp` */
export async function uploadImage(file: File, userId: string): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Faça login para enviar imagens");

  const compressed = await compressImage(file);
  const objectPath = `${userId}/${randomId()}.webp`;

  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, compressed, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

export function isDataUrl(url: string): boolean {
  return url.startsWith("data:");
}
