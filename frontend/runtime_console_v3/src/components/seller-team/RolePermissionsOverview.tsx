import { ROLE_DEFAULTS, ROLE_LABELS } from "@/lib/seller-rbac";

const ACTION_LABELS: Record<string, string> = {
  view: "Ver",
  create: "Criar",
  edit: "Editar",
  delete: "Excluir",
  export: "Exportar",
  approve: "Aprovar",
};

const MODULE_LABELS: Record<string, string> = {
  orders: "Pedidos",
  customers: "Clientes",
  inventory: "Estoque",
  catalog: "Catálogo",
  tickets: "Tickets",
  finance: "Financeiro",
  settings: "Configurações",
  team: "Equipe",
  marketing: "Marketing",
};

export function RolePermissionsOverview() {
  const roles = Object.keys(ROLE_DEFAULTS).filter((r) => r !== "store_owner");

  return (
    <div className="space-y-6" data-testid="role-permissions-overview">
      <p className="text-sm text-muted-foreground">
        Permissões padrão por função. Para ajustes individuais, abra um membro em{" "}
        <strong className="text-foreground">Equipe → Usuários</strong>.
      </p>
      {roles.map((role) => {
        const matrix = ROLE_DEFAULTS[role];
        return (
          <section key={role} className="rounded-xl border border-border bg-muted/40 p-4">
            <h3 className="font-semibold text-primary">{ROLE_LABELS[role] ?? role}</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="p-2">Módulo</th>
                    {Object.values(ACTION_LABELS).map((label) => (
                      <th key={label} className="p-2 text-center">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(matrix).map(([mod, actions]) => (
                    <tr key={mod} className="border-t border-border">
                      <td className="p-2 font-medium">{MODULE_LABELS[mod] ?? mod}</td>
                      {Object.keys(ACTION_LABELS).map((action) => (
                        <td key={action} className="p-2 text-center">
                          {actions[action] ? (
                            <span className="text-success" aria-label="Permitido">
                              ✓
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40" aria-label="Negado">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
