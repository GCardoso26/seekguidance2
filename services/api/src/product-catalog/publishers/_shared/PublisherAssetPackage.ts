/**
 * Universal Publisher Asset Package — shared interface for all publishers/manufacturers.
 * No parallel pipeline; feeds Product Catalog + Asset Pipeline.
 */

export interface PublisherAssetRef {
  role: string;
  sourceUrl: string;
  mediaType?: string;
  alt?: string;
  sourceTrust?: number;
  sourceType?: string;
}

export interface PublisherRelationshipRef {
  relationType: string;
  targetSku?: string;
  targetRef?: string;
  confidence?: number;
}

export interface PublisherAssetPackage {
  publisher: string;
  game?: string;
  expansion?: string;
  releaseDate?: string;
  language?: string;
  region?: string;
  assets: {
    cards?: PublisherAssetRef[];
    sealed?: PublisherAssetRef[];
    accessories?: PublisherAssetRef[];
    marketing?: PublisherAssetRef[];
    editorial?: PublisherAssetRef[];
    store?: PublisherAssetRef[];
    tournament?: PublisherAssetRef[];
    brand?: PublisherAssetRef[];
    expansion?: PublisherAssetRef[];
  };
  relationships?: PublisherRelationshipRef[];
  marketingAssets?: PublisherAssetRef[];
  editorialAssets?: PublisherAssetRef[];
  storeAssets?: PublisherAssetRef[];
  tournamentAssets?: PublisherAssetRef[];
  metadata?: Record<string, unknown>;
}

export interface UniversalPublisherProvider {
  readonly providerId: string;
  readonly publisher: string;
  syncAssetPackages(opts?: { since?: string; dryRun?: boolean }): Promise<PublisherAssetPackage[]>;
}

export function emptyAssetPackage(
  publisher: string,
  partial?: Partial<PublisherAssetPackage>,
): PublisherAssetPackage {
  return {
    publisher,
    assets: {},
    relationships: [],
    marketingAssets: [],
    editorialAssets: [],
    storeAssets: [],
    tournamentAssets: [],
    metadata: {},
    ...partial,
  };
}
