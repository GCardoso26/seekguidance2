import type { TransactionManager } from "../../platform/transaction/types.js";
import type { RoleAssignmentRepository } from "../domain/RoleAssignmentRepository.js";
import type { RoleName } from "../domain/models.js";

/** Grant/revoke a role to a user (idempotent). */
export class AssignRoleApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly roles: RoleAssignmentRepository,
  ) {}

  assign(userId: string, role: RoleName): Promise<void> {
    return this.tx.runInTransaction((txCtx) => this.roles.assign(txCtx, userId, role));
  }

  revoke(userId: string, role: RoleName): Promise<void> {
    return this.tx.runInTransaction((txCtx) => this.roles.revoke(txCtx, userId, role));
  }
}
