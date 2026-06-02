import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const API_BASE = process.env.API_PROXY_TARGET?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const sig = req.nextUrl.searchParams.get("sig");
  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  let question = "Judge TCG";
  let verdict = "Consulta de regras";
  let rule = "";
  let confidence = 0;
  let tcg = "magic";
  let accent = "#2563eb";

  try {
    const qs = sig ? `?sig=${encodeURIComponent(sig)}` : "";
    const res = await fetch(`${API_BASE}/runtime/judge/share/${id}${qs}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as {
        tcg: string;
        question: string;
        response: {
          verdict?: string;
          answer?: string;
          rule_applied?: string;
          confidence?: number;
        };
      };
      tcg = data.tcg;
      question = data.question;
      const r = data.response;
      verdict = (r.verdict ?? r.answer ?? "Veredito").slice(0, 120);
      rule = (r.rule_applied ?? "").slice(0, 80);
      confidence = Math.round((r.confidence ?? 0) * 100);
      if (tcg.includes("yugioh")) accent = "#eab308";
      if (tcg.includes("pokemon")) accent = "#facc15";
      if (tcg.includes("swu") || tcg.includes("star_wars")) accent = "#1d4ed8";
    }
  } catch {
    /* fallback layout */
  }

  const badge =
    confidence >= 70 ? "Alta confiança" : confidence >= 45 ? "Confiança média" : "Revisar fontes";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          padding: 48,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            {tcg.slice(0, 3).toUpperCase()}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Judge TCG</div>
        </div>
        <div style={{ fontSize: 22, opacity: 0.85, marginBottom: 16 }}>{question.slice(0, 140)}</div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.3,
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          {verdict}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <span
            style={{
              background: "rgba(255,255,255,0.15)",
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 18,
            }}
          >
            {badge} · {confidence}%
          </span>
          {rule ? (
            <span
              style={{
                background: "rgba(255,255,255,0.1)",
                padding: "8px 16px",
                borderRadius: 999,
                fontSize: 16,
              }}
            >
              {rule}
            </span>
          ) : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
