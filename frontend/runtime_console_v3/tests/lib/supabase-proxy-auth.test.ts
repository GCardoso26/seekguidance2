import { describe, expect, it } from "vitest";

function decodeBase64Url(value: string): string {
  const pad = "=".repeat((4 - (value.length % 4)) % 4);
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

describe("supabase session cookie parsing", () => {
  it("decodifica payload base64- com access_token", () => {
    const session = {
      access_token: "jwt-token-example",
      user: { id: "user-382" },
    };
    const encoded = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
    const decoded = decodeBase64Url(encoded.slice("base64-".length));
    const parsed = JSON.parse(decoded) as { access_token?: string; user?: { id?: string } };
    expect(parsed.access_token).toBe("jwt-token-example");
    expect(parsed.user?.id).toBe("user-382");
  });
});
