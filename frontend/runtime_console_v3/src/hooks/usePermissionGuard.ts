"use client";

import { useMemo } from "react";
import { mergePermissions, hasPermission as checkPermission } from "@/lib/seller-rbac";
import { useStoreUserRole } from "@/hooks/useStoreUserRole";

export function usePermissionGuard(module: string, action: string) {
  const { data: role, isLoading } = useStoreUserRole();

  const hasPermission = useMemo(() => {
    if (!role) return false;
    const perms =
      role.effective_permissions ??
      mergePermissions(role.role, role.permissions ?? null);
    return checkPermission(role.role, perms, module, action);
  }, [role, module, action]);

  return { hasPermission, isLoading };
}
