import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import type { RoleAssignmentRepository } from "../domain/RoleAssignmentRepository.js";
import type { RoleName, UserRoleAssignment } from "../domain/models.js";

function key(userId: string, role: RoleName): string {
  return `${userId}::${role}`;
}

export class InMemoryRoleAssignmentRepository
  implements RoleAssignmentRepository, TxParticipant
{
  private rows = new Map<string, UserRoleAssignment>();
  private snapshots = new Map<string, Map<string, UserRoleAssignment>>();

  beginTx(txId: string): void {
    this.snapshots.set(txId, cloneMap(this.rows));
  }
  commitTx(txId: string): void {
    this.snapshots.delete(txId);
  }
  rollbackTx(txId: string): void {
    const snap = this.snapshots.get(txId);
    if (snap) this.rows = snap;
    this.snapshots.delete(txId);
  }

  async assign(_tx: TxContext, userId: string, role: RoleName): Promise<void> {
    const k = key(userId, role);
    if (!this.rows.has(k)) {
      this.rows.set(k, { userId, role, createdAt: getClock().now() });
    }
  }

  async revoke(_tx: TxContext, userId: string, role: RoleName): Promise<void> {
    this.rows.delete(key(userId, role));
  }

  async listRoles(_tx: TxContext, userId: string): Promise<RoleName[]> {
    return [...this.rows.values()].filter((r) => r.userId === userId).map((r) => r.role);
  }
}

function cloneMap(
  src: Map<string, UserRoleAssignment>,
): Map<string, UserRoleAssignment> {
  const out = new Map<string, UserRoleAssignment>();
  for (const [k, v] of src) out.set(k, { ...v });
  return out;
}
