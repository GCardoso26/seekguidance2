export type PokemonDatasetSet = {
  id: string;
  code: string;
  name: string;
  releaseDate?: string;
};

export type PokemonDatasetCard = {
  id: string;
  name: string;
  setCode: string;
  collectorNumber?: string;
  rarity?: string;
  lang?: string;
  text?: string;
  types?: string[];
  hp?: string;
  stage?: string;
  finishes?: string[];
  imageUrl?: string;
  legalities?: Record<string, string>;
};

export type PokemonDataset = {
  version: string;
  sets: PokemonDatasetSet[];
  cards: PokemonDatasetCard[];
};
