import { ImageResponse } from "next/og";

export const runtime = "edge";

const iconStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0a0a0f",
  color: "#d4af37",
  fontWeight: 700,
} as const;

function IconLetter({ size }: { size: number }) {
  return (
    <div style={{ ...iconStyle, fontSize: Math.round(size * 0.45), borderRadius: Math.round(size * 0.18) }}>
      J
    </div>
  );
}

export async function GET() {
  return new ImageResponse(<IconLetter size={192} />, {
    width: 192,
    height: 192,
  });
}
