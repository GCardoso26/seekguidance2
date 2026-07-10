"use client";

import { useState } from "react";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { PermissionGuard } from "@/components/PermissionGuard";
import { InviteUserDrawer } from "./InviteUserDrawer";
import { TeamAuditLogs } from "./TeamAuditLogs";
import { RolePermissionsOverview } from "./RolePermissionsOverview";
import { TeamUsersTable } from "./TeamUsersTable";

type TeamView = "users" | "permissions" | "logs";

export function TeamPage({ view = "users" }: { view?: TeamView }) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <PageShell>
      <SellerHeader
        action={
          view === "users" ? (
            <PermissionGuard module="team" action="create">
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-black"
              >
                + Convidar
              </button>
            </PermissionGuard>
          ) : null
        }
      />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <PageHeader
          title={
            view === "users" ? "Usuários da equipe" : view === "logs" ? "Logs de auditoria" : "Permissões"
          }
          description={
            view === "users"
              ? "Gerencie membros e funções da sua loja."
              : view === "logs"
                ? "Histórico de ações da equipe."
                : "Matriz de permissões por função."
          }
        />
        {view === "users" && <TeamUsersTable />}
        {view === "logs" && <TeamAuditLogs />}
        {view === "permissions" && <RolePermissionsOverview />}
      </main>
      <InviteUserDrawer open={inviteOpen} onOpenChange={setInviteOpen} />
    </PageShell>
  );
}
