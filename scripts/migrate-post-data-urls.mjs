#!/usr/bin/env node
/**
 * One-off: converte data URLs em community_posts.image_url / image_urls para Storage.
 * Requer: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso: node scripts/migrate-post-data-urls.mjs [--dry-run]
 */
import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { db: { schema: "tcg_judge" } });

function parseDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], buffer: Buffer.from(m[2], "base64") };
}

async function uploadDataUrl(dataUrl, authorId) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  const ext = parsed.mime.includes("png") ? "png" : parsed.mime.includes("webp") ? "webp" : "jpg";
  const path = `${authorId}/migrated-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("community-images").upload(path, parsed.buffer, {
    contentType: parsed.mime,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("community-images").getPublicUrl(path);
  return data.publicUrl;
}

const { data: posts, error } = await supabase
  .from("community_posts")
  .select("id, author_id, image_url, image_urls")
  .or("image_url.like.data:%,image_urls.cs.{data:%}");

if (error) {
  console.error(error);
  process.exit(1);
}

let updated = 0;
for (const post of posts ?? []) {
  let imageUrl = post.image_url;
  let imageUrls = [...(post.image_urls || [])];

  if (imageUrl?.startsWith("data:")) {
    if (dryRun) {
      console.log(`[dry-run] post ${post.id} primary image`);
    } else {
      imageUrl = await uploadDataUrl(imageUrl, post.author_id);
    }
  }

  imageUrls = await Promise.all(
    imageUrls.map(async (u) => {
      if (!u.startsWith("data:")) return u;
      if (dryRun) return u;
      return (await uploadDataUrl(u, post.author_id)) ?? u;
    }),
  );

  if (dryRun) continue;

  const { error: upErr } = await supabase
    .from("community_posts")
    .update({ image_url: imageUrl, image_urls: imageUrls })
    .eq("id", post.id);
  if (upErr) console.error(post.id, upErr.message);
  else updated++;
}

console.log(dryRun ? `Dry-run: ${posts?.length ?? 0} posts candidatos` : `Migrados: ${updated}`);
