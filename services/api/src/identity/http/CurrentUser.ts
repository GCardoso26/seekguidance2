import type { RoleName, Permission } from "../domain/models.js";

/** Authenticated principal attached to a request after RequireAuth. */
export interface CurrentUser {
  userId: string;
  sessionId: string;
  roles: RoleName[];
}

export function currentUserHas(user: CurrentUser, permission: Permission): boolean {
  // Lazy import avoidance — inline the same policy as rolePolicy.
  if (user.roles.includes("admin")) return true;
  const sellerPerms: Permission[] = [
    "seller:manage",
    "inventory:write",
    "listing:write",
    "listing:delete",
  ];
  if (permission === "admin:all") return false;
  if (user.roles.includes("seller") && sellerPerms.includes(permission)) return true;
  return false;
}
