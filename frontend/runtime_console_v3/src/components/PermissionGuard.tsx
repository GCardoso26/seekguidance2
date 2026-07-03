"use client";

import type { ReactNode } from "react";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";

type PermissionGuardProps = {
  module: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGuard({ module, action, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissionGuard(module, action);
  if (isLoading) return null;
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
