import { describe, expect, it } from "vitest";
import { loadCentralManifest, manifestItemsToImported } from "../CentralManifestSource.js";
import { driveImagesToManifestItems, type DriveListedImage } from "../CentralDriveSource.js";
import { ProductCategory } from "../../../domain/enums.js";

describe("CentralManifestSource", () => {
  it("loads versioned manifest without game association", () => {
    const manifest = loadCentralManifest();
    expect(manifest.manufacturer).toBe("Central");
    expect(manifest.items.length).toBeGreaterThan(0);
    const imported = manifestItemsToImported(manifest, ProductCategory.SLEEVES);
    expect(imported.every((p) => !p.game && (p.gameCodes?.length ?? 0) === 0)).toBe(true);
    expect(imported.every((p) => p.manufacturerName === "Central")).toBe(true);
  });
});

describe("CentralDriveSource", () => {
  it("maps drive images into accessory items without TCG", () => {
    const images: DriveListedImage[] = [
      {
        fileId: "abc",
        name: "sleeve-black.png",
        mimeType: "image/png",
        sourceUrl: "https://drive.google.com/uc?export=download&id=abc",
        folderName: "Sleeves básico",
        category: "SLEEVES",
        subcategory: "STANDARD_MATTE",
        accessoryType: "sleeves",
      },
    ];
    const items = driveImagesToManifestItems(images);
    expect(items).toHaveLength(1);
    expect(items[0]!.accessoryType).toBe("sleeves");
    expect(items[0]!.images[0]!.sourceUrl).toContain("abc");
  });
});
