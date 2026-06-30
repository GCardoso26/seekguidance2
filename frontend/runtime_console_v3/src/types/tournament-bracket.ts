export type BracketFormat = "swiss" | "single_elimination" | "double_elimination" | "round_robin";

export type BracketPublicStatus = "not_started" | "open" | "in_progress" | "finished";

export type MatchDisplayStatus = "pending" | "active" | "completed" | "bye";

export type BracketMatchView = {
  id: string;
  roundNumber: number;
  matchNumber: number;
  player1Id?: string | null;
  player2Id?: string | null;
  player1Name?: string | null;
  player2Name?: string | null;
  winnerId?: string | null;
  tableNumber?: number | null;
  status?: string;
  bracketSide?: "winners" | "losers" | "grand_finals";
};

export type SwissRoundView = {
  roundNumber: number;
  pairings: Array<{
    id: string;
    tableNumber: number;
    player1Name: string;
    player2Name?: string;
    player1Points?: number;
    player2Points?: number;
    status: string;
    isBye?: boolean;
  }>;
};

export type BracketResponse = {
  bracketId: string;
  tournamentId: string;
  topCut: number;
  status: string;
  format?: BracketFormat;
  matches: BracketMatchView[];
};

export type StandingRow = {
  rank: number;
  displayName: string;
  matchPoints: number;
  matchWins?: number;
  matchLosses?: number;
  matchDraws?: number;
  omwPercent: number;
  gwPercent: number;
  ogwPercent: number;
  status: string;
};
