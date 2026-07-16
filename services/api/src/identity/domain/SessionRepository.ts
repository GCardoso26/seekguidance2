import type { TxContext } from "../../platform/transaction/types.js";
import type { CreateSessionInput, Session } from "./models.js";

/** Aggregate Root: Session. */
export interface SessionRepository {
  create(tx: TxContext, input: CreateSessionInput): Promise<Session>;
  findById(tx: TxContext, id: string): Promise<Session | null>;
  revoke(tx: TxContext, id: string): Promise<void>;
  listByUser(tx: TxContext, userId: string): Promise<Session[]>;
}
