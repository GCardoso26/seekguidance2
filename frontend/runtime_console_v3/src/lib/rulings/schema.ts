import type { TCGId } from "@/lib/game-log/schema";

export type RulingStatus = "draft" | "pending_review" | "approved" | "disputed" | "deprecated";
export type RulingHierarchy = "official" | "community_verified" | "community_pending";
export type RulingLanguage = "pt-BR" | "en" | "es";

export type RulingSource = {
  type: "comprehensive_rules" | "tournament_rules" | "set_faq" | "judge_blog" | "community";
  url?: string;
  document_version?: string;
  page_number?: number;
};

export type Ruling = {
  id: string;
  tcg: TCGId;
  status: RulingStatus;
  hierarchy: RulingHierarchy;
  title: string;
  description: string;
  question: string;
  answer: string;
  source: RulingSource;
  official_reference?: string;
  cards_involved: string[];
  keywords_involved: string[];
  version: string;
  effective_from: string;
  effective_until?: string;
  replaces?: string;
  community_votes: {
    upvotes: number;
    downvotes: number;
    verified_by: string[];
    disputed_by: string[];
  };
  created_by: string;
  created_at: string;
  updated_at: string;
  language: RulingLanguage;
  tags: string[];
};

export type CreateRulingDTO = Omit<
  Ruling,
  "id" | "community_votes" | "created_at" | "updated_at"
> & {
  community_votes?: Partial<Ruling["community_votes"]>;
};

export type RulingApplication = {
  id: string;
  ruling_id: string;
  match_id: string;
  log_sequence: number;
  applied_by: string;
  notes: string;
  created_at: string;
};

export type SearchOptions = {
  tcg?: TCGId;
  status?: RulingStatus[];
  hierarchy?: RulingHierarchy[];
  language?: RulingLanguage;
  limit?: number;
};
