import type { TransactionManager } from "../../platform/transaction/types.js";
import type { RoleAssignmentRepository } from "../domain/RoleAssignmentRepository.js";
import { rolesGrant } from "../policies/rolePolicy.js";
import type { Permission, RoleName } from "../domain/models.js";

/**
 * Read-only RBAC decision service (no JWT — that's Sprint 4.3).
 * Computes permissions from a user's assigned roles.
 */
export class AuthorizationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly roles: RoleAssignmentRepository,
  ) {}

  rolesOf(userId: string): Promise<RoleName[]> {
    return this.tx.runInTransaction((txCtx) => this.roles.listRoles(txCtx, userId));
  }

  async can(userId: string, permission: Permission): Promise<boolean> {
    const roles = await this.rolesOf(userId);
    return rolesGrant(roles, permission);
  }
}
