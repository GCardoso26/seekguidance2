/**
 * Schema versionado do dataset Lorcana (Release 1).
 * Fonte: curadoria comunitária — sem preços (Catalog nunca carrega price).
 */

export interface LorcanaDatasetSet {
  id: string;
  code: string;
  name: string;
  releaseDate?: string;
}

export interface LorcanaDatasetCard {
  id: string;
  setId: string;
  setCode: string;
  name: string;
  version?: string;
  collectorNumber?: string;
  rarity?: string;
  type?: string[];
  classifications?: string[];
  ink?: string;
  cost?: number;
  inkwell?: boolean;
  text?: string;
  strength?: number;
  willpower?: number;
  lore?: number;
  illustrators?: string[];
  lang?: string;
  imageUrl?: string;
  legalities?: Record<string, string>;
  finishes?: string[];
}

export interface LorcanaDataset {
  schemaVersion: number;
  source: string;
  notes?: string;
  sets: LorcanaDatasetSet[];
  cards: LorcanaDatasetCard[];
}
