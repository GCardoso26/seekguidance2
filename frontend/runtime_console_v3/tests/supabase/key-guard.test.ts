import { describe, expect, it, vi } from "vitest";
import { assertAnonSupabaseKey } from "@/lib/supabase/key-guard";

/** JWT de teste: payload {"role":"service_role"} (não é uma chave real). */
const SERVICE_ROLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature";

/** JWT de teste: payload {"role":"anon"} */
const ANON_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.signature";

describe("assertAnonSupabaseKey", () => {
  it("allows anon role", () => {
    expect(() => assertAnonSupabaseKey(ANON_JWT)).not.toThrow();
  });

  it("throws in development for service_role", () => {
    vi.stubEnv("NODE_ENV", "development");
    try {
      expect(() => assertAnonSupabaseKey(SERVICE_ROLE_JWT)).toThrow(/service_role/);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
