/**
 * Public API — Assets BC (ADR-011).
 * Other BCs may import only from this module.
 */
export { createAssetService, AssetService, PostgresAssetRepository } from "./AssetService.js";
export type {
  AssetEntityType,
  AssetRole,
  AssetRecord,
  AssetMetadata,
  AssetLinkInput,
  IngestAssetInput,
  IngestAssetResult,
} from "./domain/types.js";
export {
  MEDIA_TYPES,
  MEDIA_TYPE_META,
  SEALED_GALLERY_SHOTS,
  ACCESSORY_KINDS,
  isMediaType,
  type MediaType,
  type SealedGalleryShot,
  type AccessoryKind,
} from "./domain/mediaTypes.js";
export {
  CARD_IMAGE_SIZES,
  PRODUCT_IMAGE_SIZES,
  HERO_IMAGE_SIZES,
  BANNER_IMAGE_SIZES,
  OUTPUT_FORMATS,
  type CardImageSize,
  type OutputFormat,
} from "./domain/imageSizes.js";
export {
  buildDerivativeUrl,
  buildDerivativeSet,
  buildFormatUrl,
  buildFormatDerivativeMap,
  pickSafeDerivativeSize,
  type CdnDerivativeSize,
} from "./cdn/derivativeUrls.js";
export { assetMediaPipeline, AssetMediaPipeline } from "./media/AssetMediaPipeline.js";
