import { describe, expect, it } from "vitest";
import { extractLorcanaSetsPayload, normalizeLorcanaSetRow } from "../lorcanaSetNormalize.js";

describe("normalizeLorcanaSetRow", () => {
  it("maps lorcana-api PascalCase fields (Set_ID / Name / Release_Date)", () => {
    const norm = normalizeLorcanaSetRow({
      Set_Num: 7,
      Release_Date: "2025-03-07",
      Cards: 204,
      Name: "Archazia's Island",
      Set_ID: "ARI",
    });
    expect(norm).toEqual({
      code: "ARI",
      name: "Archazia's Island",
      releaseDate: "2025-03-07",
      image: undefined,
    });
  });

  it("maps camelCase / nested images when present", () => {
    const norm = normalizeLorcanaSetRow({
      code: "tfc",
      name: "The First Chapter",
      releaseDate: "2023-08-18",
      images: { logo: "https://cdn.example/logo.png" },
    });
    expect(norm).toEqual({
      code: "tfc",
      name: "The First Chapter",
      releaseDate: "2023-08-18",
      image: "https://cdn.example/logo.png",
    });
  });

  it("returns null when code or name missing", () => {
    expect(normalizeLorcanaSetRow({ Set_ID: "ARI" })).toBeNull();
    expect(normalizeLorcanaSetRow({ Name: "Only name" })).toBeNull();
  });
});

describe("extractLorcanaSetsPayload", () => {
  it("accepts bare array (lorcana-api bulk/sets)", () => {
    const rows = extractLorcanaSetsPayload([{ Set_ID: "ARI", Name: "Archazia's Island" }]);
    expect(rows).toHaveLength(1);
  });

  it("accepts { data } and { sets } wrappers", () => {
    expect(extractLorcanaSetsPayload({ data: [{ a: 1 }] })).toHaveLength(1);
    expect(extractLorcanaSetsPayload({ sets: [{ a: 1 }] })).toHaveLength(1);
  });
});
