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

/** Crop centralizado para banner de evento 350×500 (2:3 retrato), WebP. */
export async function cropToEventBanner350x500(file: File): Promise<Blob> {
  const TARGET_W = 350;
  const TARGET_H = 500;
  const bitmap = await createImageBitmap(file);
  const srcRatio = bitmap.width / bitmap.height;
  const targetRatio = TARGET_W / TARGET_H;

  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (srcRatio > targetRatio) {
    sw = Math.round(bitmap.height * targetRatio);
    sx = Math.round((bitmap.width - sw) / 2);
  } else {
    sh = Math.round(bitmap.width / targetRatio);
    sy = Math.round((bitmap.height - sh) / 2);
  }

  const canvas = document.createElement("canvas");
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha no crop do banner"))),
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

/** Upload de banner 350×500 para eventos. */
export async function uploadEventBanner(file: File, userId: string): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Faça login para enviar imagens");

  const cropped = await cropToEventBanner350x500(file);
  const objectPath = `${userId}/event-banners/${randomId()}.webp`;

  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, cropped, {
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
