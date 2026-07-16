import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import type { RoleAssignmentRepository } from "../domain/RoleAssignmentRepository.js";
import type { RoleName } from "../domain/models.js";

export class PostgresRoleAssignmentRepository implements RoleAssignmentRepository {
  async assign(tx: TxContext, userId: string, role: RoleName): Promise<void> {
    const client = requirePostgresClient(tx);
    await client.query(
      `INSERT INTO identity.user_roles (user_id, role) VALUES ($1, $2)
       ON CONFLICT (user_id, role) DO NOTHING`,
      [userId, role],
    );
  }

  async revoke(tx: TxContext, userId: string, role: RoleName): Promise<void> {
    const client = requirePostgresClient(tx);
    await client.query(
      `DELETE FROM identity.user_roles WHERE user_id = $1 AND role = $2`,
      [userId, role],
    );
  }

  async listRoles(tx: TxContext, userId: string): Promise<RoleName[]> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT role FROM identity.user_roles WHERE user_id = $1 ORDER BY role`,
      [userId],
    );
    return res.rows.map((r) => r.role as RoleName);
  }
}
