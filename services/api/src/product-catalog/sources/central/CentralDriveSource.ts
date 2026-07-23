/**
 * Google Drive adapter for Central official materials.
 * Enabled only when PRODUCT_CATALOG_CENTRAL_DRIVE_API is on + API key present.
 * Lists public image files under the official folder; never scrapes private content.
 */

export const CENTRAL_DRIVE_FOLDER_ID = "1BB8Sywy2XPOFoUI03Fx8BsRdgoj4Rih8";

const FOLDER_TO_ACCESSORY: Record<string, { category: string; subcategory: string; accessoryType: string }> = {
  Albuns: { category: "BINDER", subcategory: "POCKET_ALBUM", accessoryType: "binder" },
  Bandeja: { category: "DICE", subcategory: "DICE_TRAY", accessoryType: "dice_tray" },
  Deckboxes: { category: "DECK_BOX", subcategory: "PLASTIC", accessoryType: "deck_box" },
  "Folhas premium": { category: "BINDER_PAGE", subcategory: "POCKET_9", accessoryType: "binder" },
  "Outer sleeve": { category: "SLEEVES", subcategory: "OUTER_SLEEVES", accessoryType: "outer_sleeves" },
  Playmats: { category: "PLAYMAT", subcategory: "STANDARD", accessoryType: "playmat" },
  "Pocket Album": { category: "BINDER", subcategory: "PORTFOLIO", accessoryType: "portfolio" },
  Shields: { category: "SLEEVES", subcategory: "STANDARD_MATTE", accessoryType: "sleeves" },
  "Sleeves básico": { category: "SLEEVES", subcategory: "STANDARD_MATTE", accessoryType: "sleeves" },
  "Sleeves Board Game": { category: "SLEEVES", subcategory: "BOARD_GAME", accessoryType: "board_game_accessories" },
  Toploaders: { category: "COUNTERS", subcategory: "TOP_LOADER", accessoryType: "top_loader" },
  Tubos: { category: "PLAYMAT", subcategory: "PLAYMAT_TUBE", accessoryType: "playmat_tube" },
  UltraPro: { category: "COUNTERS", subcategory: "OTHER", accessoryType: "other" },
};

export interface DriveListedImage {
  fileId: string;
  name: string;
  mimeType: string;
  sourceUrl: string;
  folderName: string;
  category: string;
  subcategory: string;
  accessoryType: string;
}

export interface DriveListClient {
  listChildren(folderId: string): Promise<Array<{ id: string; name: string; mimeType: string }>>;
}

function publicDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export class GoogleDriveListClient implements DriveListClient {
  constructor(private readonly apiKey: string) {}

  async listChildren(folderId: string): Promise<Array<{ id: string; name: string; mimeType: string }>> {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const url =
      `https://www.googleapis.com/drive/v3/files?q=${q}` +
      `&fields=files(id,name,mimeType)&pageSize=200&key=${encodeURIComponent(this.apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`drive_list_${res.status}`);
    const body = (await res.json()) as { files?: Array<{ id: string; name: string; mimeType: string }> };
    return body.files ?? [];
  }
}

export async function listCentralDriveImages(
  client: DriveListClient,
  rootFolderId = CENTRAL_DRIVE_FOLDER_ID,
): Promise<DriveListedImage[]> {
  const roots = await client.listChildren(rootFolderId);
  const out: DriveListedImage[] = [];
  for (const folder of roots) {
    if (folder.mimeType !== "application/vnd.google-apps.folder") continue;
    const mapping = FOLDER_TO_ACCESSORY[folder.name];
    if (!mapping) continue;
    const children = await client.listChildren(folder.id);
    for (const file of children) {
      if (!file.mimeType.startsWith("image/")) continue;
      out.push({
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        sourceUrl: publicDownloadUrl(file.id),
        folderName: folder.name,
        ...mapping,
      });
    }
  }
  return out;
}

export function driveImagesToManifestItems(
  images: DriveListedImage[],
): Array<{
  sku: string;
  titlePt: string;
  category: string;
  subcategory: string;
  accessoryType: string;
  images: Array<{ role: "packshot"; sourceUrl: string; isPrimary: boolean }>;
}> {
  const bySku = new Map<string, DriveListedImage[]>();
  for (const img of images) {
    const base = img.name.replace(/\.[^.]+$/, "").trim() || img.fileId;
    const sku = `CEN-DRIVE-${img.accessoryType}-${base}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-");
    const list = bySku.get(sku) ?? [];
    list.push(img);
    bySku.set(sku, list);
  }
  return [...bySku.entries()].map(([sku, imgs]) => ({
    sku,
    titlePt: imgs[0]!.name.replace(/\.[^.]+$/, ""),
    category: imgs[0]!.category,
    subcategory: imgs[0]!.subcategory,
    accessoryType: imgs[0]!.accessoryType,
    images: imgs.map((i, idx) => ({
      role: "packshot" as const,
      sourceUrl: i.sourceUrl,
      isPrimary: idx === 0,
    })),
  }));
}
