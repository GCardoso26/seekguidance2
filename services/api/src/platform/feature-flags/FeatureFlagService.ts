import type { Pool, PoolClient } from "pg";
import { createHash } from "node:crypto";

type Q = Pool | PoolClient;

export type FeatureStrategy = "ON" | "OFF" | "CANARY" | "PERCENTAGE" | "USER" | "SELLER" | "REGION";

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  strategy: FeatureStrategy;
  conditions: Record<string, unknown>;
}

export interface FeatureEvalContext {
  userId?: string;
  sellerId?: string;
  region?: string;
}

export class PostgresFeatureFlagRepository {
  constructor(private readonly db: Q) {}

  async get(name: string): Promise<FeatureFlag | null> {
    const res = await this.db.query(
      `SELECT name, enabled, rollout_percentage, strategy, conditions FROM platform.feature_flags WHERE name = $1`,
      [name],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      name: row.name,
      enabled: row.enabled,
      rolloutPercentage: row.rollout_percentage,
      strategy: row.strategy,
      conditions: row.conditions ?? {},
    };
  }

  async list(): Promise<FeatureFlag[]> {
    const res = await this.db.query(
      `SELECT name, enabled, rollout_percentage, strategy, conditions FROM platform.feature_flags ORDER BY name`,
    );
    return res.rows.map((row) => ({
      name: row.name,
      enabled: row.enabled,
      rolloutPercentage: row.rollout_percentage,
      strategy: row.strategy,
      conditions: row.conditions ?? {},
    }));
  }
}

export class FeatureFlagService {
  constructor(private readonly repo: PostgresFeatureFlagRepository) {}

  async isEnabled(name: string, ctx: FeatureEvalContext = {}): Promise<boolean> {
    const flag = await this.repo.get(name);
    if (!flag) return false;
    switch (flag.strategy) {
      case "ON":
        return true;
      case "OFF":
        return false;
      case "PERCENTAGE":
      case "CANARY": {
        const seed = ctx.userId ?? ctx.sellerId ?? "anonymous";
        const bucket = hashBucket(`${name}:${seed}`);
        return bucket < flag.rolloutPercentage;
      }
      case "USER": {
        const users = (flag.conditions.userIds as string[] | undefined) ?? [];
        return Boolean(ctx.userId && users.includes(ctx.userId));
      }
      case "SELLER": {
        const sellers = (flag.conditions.sellerIds as string[] | undefined) ?? [];
        return Boolean(ctx.sellerId && sellers.includes(ctx.sellerId));
      }
      case "REGION": {
        const regions = (flag.conditions.regions as string[] | undefined) ?? [];
        return Boolean(ctx.region && regions.includes(ctx.region));
      }
      default:
        return flag.enabled;
    }
  }
}

function hashBucket(input: string): number {
  const hex = createHash("sha256").update(input).digest("hex").slice(0, 8);
  return parseInt(hex, 16) % 100;
}

export function createFeatureFlagService(db: Pool | PoolClient): FeatureFlagService {
  return new FeatureFlagService(new PostgresFeatureFlagRepository(db));
}

/** In-memory for tests / boot without DB. */
export class InMemoryFeatureFlagService {
  constructor(private readonly flags: Record<string, boolean>) {}
  async isEnabled(name: string, _ctx: FeatureEvalContext = {}): Promise<boolean> {
    return this.flags[name] ?? false;
  }
}
