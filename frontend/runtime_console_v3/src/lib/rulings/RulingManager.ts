import { RulingSearch } from "@/lib/rulings/RulingSearch";
import type { CreateRulingDTO, Ruling, RulingStatus } from "@/lib/rulings/schema";

export class RulingManager {
  private rulings: Ruling[];
  private readonly search: RulingSearch;

  constructor(initial: Ruling[] = []) {
    this.rulings = [...initial];
    this.search = new RulingSearch(this.rulings);
  }

  getAll(): Ruling[] {
    return [...this.rulings];
  }

  create(dto: CreateRulingDTO): Ruling {
    const now = new Date().toISOString();
    const ruling: Ruling = {
      id: globalThis.crypto?.randomUUID?.() ?? `ruling-${Date.now()}`,
      ...dto,
      community_votes: {
        upvotes: 0,
        downvotes: 0,
        verified_by: [],
        disputed_by: [],
        ...dto.community_votes,
      },
      created_at: now,
      updated_at: now,
    };
    this.rulings.push(ruling);
    return ruling;
  }

  update(id: string, changes: Partial<Ruling>): Ruling {
    const idx = this.rulings.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error("Ruling não encontrada");
    this.rulings[idx] = {
      ...this.rulings[idx],
      ...changes,
      updated_at: new Date().toISOString(),
    };
    return this.rulings[idx];
  }

  verify(id: string, judgeId: string): Ruling {
    const ruling = this.rulings.find((r) => r.id === id);
    if (!ruling) throw new Error("Ruling não encontrada");
    if (!ruling.community_votes.verified_by.includes(judgeId)) {
      ruling.community_votes.verified_by.push(judgeId);
    }
    ruling.hierarchy = "community_verified";
    ruling.status = "approved";
    ruling.updated_at = new Date().toISOString();
    return ruling;
  }

  dispute(id: string, judgeId: string, _reason: string): Ruling {
    const ruling = this.rulings.find((r) => r.id === id);
    if (!ruling) throw new Error("Ruling não encontrada");
    if (!ruling.community_votes.disputed_by.includes(judgeId)) {
      ruling.community_votes.disputed_by.push(judgeId);
    }
    ruling.status = "disputed";
    ruling.updated_at = new Date().toISOString();
    return ruling;
  }

  deprecate(id: string, replacedBy?: string): Ruling {
    return this.update(id, {
      status: "deprecated",
      replaces: replacedBy,
      effective_until: new Date().toISOString().slice(0, 10),
    });
  }

  vote(id: string, _userId: string, direction: "up" | "down"): void {
    const ruling = this.rulings.find((r) => r.id === id);
    if (!ruling) throw new Error("Ruling não encontrada");
    if (direction === "up") ruling.community_votes.upvotes += 1;
    else ruling.community_votes.downvotes += 1;
  }

  getSearch(): RulingSearch {
    return new RulingSearch(this.rulings);
  }
}

export function isActiveRuling(ruling: Ruling, onDate = new Date()): boolean {
  if (ruling.status === "deprecated") return false;
  const from = new Date(ruling.effective_from);
  if (onDate < from) return false;
  if (ruling.effective_until) {
    return onDate <= new Date(ruling.effective_until);
  }
  return true;
}

export type { RulingStatus };
