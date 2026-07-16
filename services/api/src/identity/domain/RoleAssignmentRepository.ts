import type { TxContext } from "../../platform/transaction/types.js";
import type { RoleName } from "./models.js";

/** Supporting store: user ↔ role assignments (idempotent). */
export interface RoleAssignmentRepository {
  assign(tx: TxContext, userId: string, role: RoleName): Promise<void>;
  revoke(tx: TxContext, userId: string, role: RoleName): Promise<void>;
  listRoles(tx: TxContext, userId: string): Promise<RoleName[]>;
}
