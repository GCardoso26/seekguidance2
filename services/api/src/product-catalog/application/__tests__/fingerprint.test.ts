import { describe, expect, it } from "vitest";
import { buildVariantFingerprint, fingerprintFromVariantDto } from "../fingerprint.js";

describe("variant fingerprint", () => {
  it("mantém o formato estável quando não há discriminador", () => {
    expect(
      buildVariantFingerprint({ brandSlug: "Dragon Shield", productSlug: "matte black" }),
    ).toBe("dragonshield|matteblack");
  });

  it("separa selados homônimos pelo SKU", () => {
    const base = { brandName: "POKEMON", titlePt: "Elite Trainer Box", variantName: "Padrão" };
    const a = fingerprintFromVariantDto({ ...base, discriminator: "POKEMON-ETB-G1-100" });
    const b = fingerprintFromVariantDto({ ...base, discriminator: "POKEMON-ETB-G2-200" });

    expect(a).not.toBe(b);
    expect(fingerprintFromVariantDto(base)).toBe(
      fingerprintFromVariantDto({ ...base, discriminator: undefined }),
    );
  });
});
