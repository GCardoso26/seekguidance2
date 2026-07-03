export type PermissionMatrix = Record<string, Record<string, boolean>>;

export const ROLE_LABELS: Record<string, string> = {
  store_owner: "Proprietário",
  manager: "Gerente",
  operator: "Operador",
  stock_keeper: "Estoquista",
  support: "Suporte",
  finance: "Financeiro",
  marketing: "Marketing",
};

const ALL_ACTIONS = ["view", "create", "edit", "delete", "export", "approve"] as const;
const MODULES = [
  "orders",
  "customers",
  "inventory",
  "catalog",
  "tickets",
  "finance",
  "settings",
  "team",
  "marketing",
] as const;

function fullAccess(): PermissionMatrix {
  return Object.fromEntries(
    MODULES.map((m) => [m, Object.fromEntries(ALL_ACTIONS.map((a) => [a, true]))]),
  );
}

export const ROLE_DEFAULTS: Record<string, PermissionMatrix> = {
  store_owner: fullAccess(),
  manager: {
    orders: { view: true, create: true, edit: true, delete: false, export: true, approve: true },
    customers: { view: true, create: true, edit: true, delete: false, export: true, approve: false },
    inventory: { view: true, create: true, edit: true, delete: false, export: false, approve: false },
    catalog: { view: true, create: true, edit: true, delete: false, export: false, approve: false },
    tickets: { view: true, create: true, edit: true, delete: false, export: false, approve: false },
    finance: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
    settings: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
    team: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
    marketing: { view: true, create: true, edit: true, delete: false, export: true, approve: false },
  },
  operator: {
    orders: { view: true, create: false, edit: true, delete: false, export: false, approve: false },
    customers: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
    inventory: { view: true, create: false, edit: true, delete: false, export: false, approve: false },
    catalog: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
    tickets: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
    finance: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    settings: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    team: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    marketing: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
  },
  stock_keeper: {
    orders: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    customers: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    inventory: { view: true, create: true, edit: true, delete: false, export: false, approve: false },
    catalog: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
    tickets: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    finance: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    settings: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    team: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    marketing: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
  },
  support: {
    orders: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
    customers: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
    inventory: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    catalog: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    tickets: { view: true, create: true, edit: true, delete: false, export: false, approve: false },
    finance: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    settings: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    team: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    marketing: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
  },
  finance: {
    orders: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
    customers: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    inventory: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    catalog: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    tickets: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    finance: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
    settings: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    team: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    marketing: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
  },
  marketing: {
    orders: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    customers: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
    inventory: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    catalog: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
    tickets: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    finance: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    settings: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    team: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
    marketing: { view: true, create: true, edit: true, delete: false, export: true, approve: false },
  },
};

export const MODULE_LABELS: Record<string, string> = {
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

export const ACTION_LABELS: Record<string, string> = {
  view: "Visualizar",
  create: "Criar",
  edit: "Editar",
  delete: "Excluir",
  export: "Exportar",
  approve: "Aprovar",
};

export function mergePermissions(
  role: string,
  override?: PermissionMatrix | null,
): PermissionMatrix {
  const base = structuredClone(ROLE_DEFAULTS[role] ?? ROLE_DEFAULTS.operator);
  if (!override) return base;
  for (const [module, actions] of Object.entries(override)) {
    if (!base[module]) base[module] = {};
    for (const [action, allowed] of Object.entries(actions)) {
      base[module][action] = Boolean(allowed);
    }
  }
  return base;
}

export function hasPermission(
  role: string,
  permissions: PermissionMatrix | null | undefined,
  module: string,
  action: string,
): boolean {
  if (role === "store_owner") return true;
  const matrix = permissions ?? mergePermissions(role, null);
  return Boolean(matrix[module]?.[action]);
}
