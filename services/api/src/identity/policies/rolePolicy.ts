import type { RoleName, Permission } from "../domain/models.js";

/**
 * Frozen RBAC policy (IDENTITY_DOMAIN.md). Roles are fixed; permissions derive from roles.
 * `admin:all` implies every permission.
 */
export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  buyer: [],
  seller: ["seller:manage", "inventory:write", "listing:write", "listing:delete"],
  admin: ["admin:all"],
};

export function permissionsForRoles(roles: RoleName[]): Set<Permission> {
  const out = new Set<Permission>();
  for (const role of roles) for (const p of ROLE_PERMISSIONS[role]) out.add(p);
  return out;
}

export function rolesGrant(roles: RoleName[], permission: Permission): boolean {
  const perms = permissionsForRoles(roles);
  return perms.has("admin:all") || perms.has(permission);
}
