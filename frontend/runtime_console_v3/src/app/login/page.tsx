"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runtimeApi } from "@/services/api/runtime";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setApiKey = useAuthStore((s) => s.setApiKey);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [apiKey, setKey] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      if (apiKey.trim()) { setApiKey(apiKey.trim()); router.push("/dashboard"); return; }
      const r = await runtimeApi.login(username, password);
      if (!r.authenticated) throw new Error("Invalid credentials");
      setSession({ accessToken: r.tokens.access_token, refreshToken: r.tokens.refresh_token, username });
      router.push("/dashboard");
    } catch (ex) { setErr(ex instanceof Error ? ex.message : "Login failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Runtime Console</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onLogin} className="space-y-3">
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input placeholder="API Key (optional)" value={apiKey} onChange={(e) => setKey(e.target.value)} />
            {err && <p className="text-sm text-danger">{err}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "..." : "Sign in"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
