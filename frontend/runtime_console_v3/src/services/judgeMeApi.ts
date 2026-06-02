import { apiFetch } from "@/services/api/client";

export type JudgeMeResponse = {
  user_id: string | null;
  username: string | null;
  email: string | null;
  role: string;
  is_admin: boolean;
  can_ingest: boolean;
};

export async function fetchJudgeMe(): Promise<JudgeMeResponse> {
  return apiFetch<JudgeMeResponse>("/runtime/judge/me", { publicRoute: false });
}
