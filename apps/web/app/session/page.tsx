"use client";

import { useAuth } from "@/src/auth/auth-provider";
import { Protected } from "@/src/components/Protected";
import { Button, Card } from "@/src/components/ui";
import { useRouter } from "next/navigation";

function SessionBody() {
  const { user, logout, refresh, state } = useAuth();
  const router = useRouter();

  return (
    <Card className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Sessão</h1>
      <dl className="grid gap-2 text-sm text-zinc-700">
        <div>
          <dt className="font-medium text-zinc-900">Estado</dt>
          <dd>{state}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-900">User ID</dt>
          <dd className="font-mono text-xs">{user?.userId}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-900">E-mail</dt>
          <dd>{user?.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-900">Roles</dt>
          <dd>{user?.roles.join(", ")}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-900">Session ID</dt>
          <dd className="font-mono text-xs">{user?.sessionId}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void refresh();
          }}
        >
          Refresh token
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
        >
          Logout
        </Button>
        <Button type="button" onClick={() => router.push("/seller")}>
          Ir para Seller
        </Button>
      </div>
    </Card>
  );
}

export default function SessionPage() {
  return (
    <Protected>
      <SessionBody />
    </Protected>
  );
}
