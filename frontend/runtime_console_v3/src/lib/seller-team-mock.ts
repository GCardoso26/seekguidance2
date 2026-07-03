import { ROLE_DEFAULTS } from "@/lib/seller-rbac";

export function sellerTeamMeMock() {
  return {
    role: {
      user_id: "owner-1",
      store_id: "store-1",
      role: "store_owner",
      permissions: null,
      is_active: true,
      is_owner: true,
      effective_permissions: ROLE_DEFAULTS.store_owner,
    },
  };
}

export function sellerTeamUsersMock() {
  return {
    users: [
      {
        id: "owner",
        user_id: "owner-1",
        store_id: "store-1",
        role: "store_owner",
        display_name: "Loja Demo",
        invited_email: null,
        is_active: true,
        is_owner: true,
        effective_permissions: ROLE_DEFAULTS.store_owner,
      },
      {
        id: "role-1",
        user_id: "user-ana",
        store_id: "store-1",
        role: "manager",
        display_name: "Ana Paula",
        profile_name: "Ana Paula",
        handle: "anapaula",
        invited_email: "ana@loja.com",
        is_active: true,
        is_owner: false,
        effective_permissions: ROLE_DEFAULTS.manager,
      },
      {
        id: "role-2",
        user_id: "user-carlos",
        store_id: "store-1",
        role: "support",
        display_name: "Carlos",
        invited_email: "carlos@loja.com",
        is_active: true,
        is_owner: false,
        effective_permissions: ROLE_DEFAULTS.support,
      },
    ],
  };
}

export function sellerTeamLogsMock() {
  return {
    logs: [
      {
        id: "log-1",
        store_id: "store-1",
        user_id: "owner-1",
        action: "team.invite",
        resource_type: "team_user",
        resource_id: "role-1",
        details: { email: "ana@loja.com", role: "manager" },
        actor_name: "Loja Demo",
        created_at: new Date().toISOString(),
      },
      {
        id: "log-2",
        store_id: "store-1",
        user_id: "owner-1",
        action: "team.role_update",
        resource_type: "team_user",
        resource_id: "user-carlos",
        details: { role: "support" },
        actor_name: "Loja Demo",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    total: 2,
    page: 1,
    limit: 50,
  };
}
