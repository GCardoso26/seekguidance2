import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) {
    return new Response("Missing postId", { status: 400 });
  }

  let title = "Comunidade Judge TCG";
  let author = "@jogador";
  let excerpt = "Discussão na comunidade TCG";

  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/social/posts/${encodeURIComponent(postId)}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const post = (await res.json()) as {
        title?: string;
        content?: string;
        authorHandle?: string;
        authorDisplayName?: string;
      };
      title = (post.title ?? post.content?.slice(0, 80) ?? title).slice(0, 100);
      author = post.authorDisplayName ?? post.authorHandle ?? author;
      excerpt = (post.content ?? "").replace(/[#*_`]/g, "").slice(0, 160);
    }
  } catch {
    /* fallback */
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
          color: "white",
          padding: 56,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 22, color: "#d4af37", marginBottom: 16 }}>Judge TCG · Comunidade</div>
        <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.2, marginBottom: 24 }}>{title}</div>
        <div style={{ fontSize: 22, opacity: 0.85, flex: 1, lineHeight: 1.4 }}>{excerpt}</div>
        <div style={{ fontSize: 20, opacity: 0.7 }}>por {author}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
