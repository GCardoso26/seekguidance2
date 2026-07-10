"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scale } from "lucide-react";
import "@/styles/luxury-marketing.css";
import { Input } from "@/components/ui/input";
import { normalizeInternalPath } from "@/lib/auth/safe-path";
import { runtimeApi } from "@/services/api/runtime";
import { useAuthStore } from "@/stores/auth-store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [apiKey, setKey] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const nextPath = normalizeInternalPath(searchParams.get("next") ?? "/dashboard", "/dashboard");

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      if (apiKey.trim()) {
        await runtimeApi.setApiKey(apiKey.trim());
        setAuthenticated({ username: "api_key", tenantId: "default" });
        router.push(nextPath);
        return;
      }
      const r = await runtimeApi.login(username, password);
      if (!r.authenticated) throw new Error("Credenciais inválidas");
      setAuthenticated({
        username: r.user?.username ?? username,
        tenantId: r.tenant_id ?? "default",
        role: (r.user as { role?: string })?.role ?? "viewer",
      });
      router.push(nextPath);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="luxury-marketing flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="luxury-card w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Scale className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Console</p>
            <h1 className="text-lg font-medium text-foreground">Runtime Console</h1>
          </div>
        </div>
        <form onSubmit={onLogin} className="space-y-3">
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="border-border bg-muted/50 text-foreground"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="border-border bg-muted/50 text-foreground"
          />
          <Input
            placeholder="API Key (opcional)"
            value={apiKey}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
            className="border-border bg-muted/50 text-foreground"
          />
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button type="submit" className="luxury-btn-primary w-full" disabled={loading}>
            {loading ? "…" : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Acesso admin: <span className="font-mono text-foreground">admin</span> /{" "}
          <span className="font-mono text-foreground">admin</span>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="luxury-marketing flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Carregando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
