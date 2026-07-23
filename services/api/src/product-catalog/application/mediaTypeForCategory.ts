import type { MediaType } from "../../assets/domain/mediaTypes.js";
import { ProductCategory } from "../domain/enums.js";

/** Mapeia categoria do Product Catalog → mediaType do Asset Pipeline V2. */
export function mediaTypeForCategory(category: string, role?: "primary" | "gallery" | "lifestyle"): MediaType {
  if (category === ProductCategory.SEALED_PRODUCT) {
    return role === "gallery" ? "SEALED_GALLERY" : "SEALED_PRODUCT";
  }
  if (role === "lifestyle") return "ACCESSORY_LIFESTYLE";
  if (role === "gallery") return "ACCESSORY_GALLERY";
  return "ACCESSORY";
}
