import type { TxContext } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { User, UserUpsert } from "./models.js";

/** Aggregate Root: User (pure identity). */
export interface UserRepository {
  upsert(tx: TxContext, input: UserUpsert): Promise<RepositoryResult<User>>;
  findById(tx: TxContext, id: string): Promise<User | null>;
  findByEmail(tx: TxContext, email: string): Promise<User | null>;
}
