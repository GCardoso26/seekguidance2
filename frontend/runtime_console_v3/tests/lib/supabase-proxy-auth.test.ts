import { combineChunks, stringFromBase64URL } from "@supabase/ssr";
import { describe, expect, it } from "vitest";

const BASE64_PREFIX = "base64-";

function parseSupabaseSessionPayload(raw: string) {
  let decoded = raw;
  if (decoded.startsWith(BASE64_PREFIX)) {
    decoded = stringFromBase64URL(decoded.slice(BASE64_PREFIX.length));
  }
  return JSON.parse(decoded) as { access_token?: string; user?: { id?: string } };
}

describe("supabase session cookie parsing", () => {
  it("decodifica payload base64- com access_token", () => {
    const session = {
      access_token: "jwt-token-example",
      user: { id: "user-382" },
    };
    const encoded = `${BASE64_PREFIX}${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
    const parsed = parseSupabaseSessionPayload(encoded);
    expect(parsed.access_token).toBe("jwt-token-example");
    expect(parsed.user?.id).toBe("user-382");
  });

  it("recombina cookies fragmentados (.0, .1)", async () => {
    const session = {
      access_token: "chunked-jwt",
      user: { id: "user-chunk" },
    };
    const full = `${BASE64_PREFIX}${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
    const key = "sb-test-auth-token";
    const chunk0 = full.slice(0, 200);
    const chunk1 = full.slice(200);

    const combined = await combineChunks(key, async (chunkName) => {
      if (chunkName === `${key}.0`) return chunk0;
      if (chunkName === `${key}.1`) return chunk1;
      return null;
    });

    expect(combined).toBe(full);
    const parsed = parseSupabaseSessionPayload(combined!);
    expect(parsed.access_token).toBe("chunked-jwt");
    expect(parsed.user?.id).toBe("user-chunk");
  });
});
