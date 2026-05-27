import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Judge TCG — Consulta de Regras Oficiais";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function JudgeOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px 80px",
          background: "linear-gradient(135deg, #c41e1e 0%, #8b1515 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            JT
          </div>
          <p style={{ fontSize: 22, fontWeight: 600, opacity: 0.85, letterSpacing: 4 }}>
            JUDGE TCG
          </p>
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, margin: 0, maxWidth: 900 }}>
          Consulta de Regras Oficiais
        </h1>
        <p style={{ fontSize: 28, marginTop: 24, opacity: 0.9, maxWidth: 820, lineHeight: 1.4 }}>
          Magic, Pokémon, Yu-Gi-Oh!, FAB, Digimon e mais — respostas com fontes indexadas.
        </p>
      </div>
    ),
    { ...size },
  );
}
