# ESPECIFICAÇÃO TÉCNICA — Judge TCG v3.0
## Landing Page, Admin RBAC, Ingestão SWU, Logos Customizados

---

## 1. CONTROLE DE ACESSO ADMIN (RBAC)

### Contexto Existente (Wave 1 — Security P0)
- `services/api/app/core/security/rbac.py` — roles: admin, operator, replay
- `services/api/app/core/security/middleware.py` — proteção de rotas operacionais
- `SECURITY_PROTECT_OPERATIONAL_ROUTES=true` em produção

### Requisito
Botões "Métricas" e "Console" visíveis APENAS para usuários com role `admin`.

### Implementação

#### Backend — Verificação de Role

```python
# services/api/app/api/v1/runtime_judge.py (adicionar endpoint)
from app.core.security.rbac import require_role

@router.get("/runtime/judge/me")
async def get_current_user_info(
    user=Depends(require_role("admin")),  # retorna 403 se não for admin
):
    return {
        "user_id": user.id,
        "role": user.role,  # "admin" | "operator" | "player"
        "email": user.email,
        "is_admin": user.role == "admin",
    }
```

#### Frontend — Condicional de Renderização

```typescript
// src/hooks/useUserRole.ts
import { useAuth } from "@/features/auth/useAuth";

export function useUserRole() {
  const { user } = useAuth();
  return {
    isAdmin: user?.role === "admin",
    isOperator: user?.role === "operator",
    isPlayer: user?.role === "player" || !user,
    role: user?.role || "anonymous",
  };
}
```

```tsx
// src/components/layout/Header.tsx ou JudgePageClient.tsx
import { useUserRole } from "@/hooks/useUserRole";

export function Header() {
  const { isAdmin } = useUserRole();

  return (
    <header>
      {/* ... outros elementos ... */}

      {isAdmin && (
        <div className="admin-actions">
          <Link href="/observability?tab=judge">
            <Button variant="ghost" size="sm">
              <BarChart3 size={16} className="mr-2" />
              Métricas
            </Button>
          </Link>
          <Link href="/admin/console">
            <Button variant="ghost" size="sm">
              <Terminal size={16} className="mr-2" />
              Console
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
```

#### Proteção de Rotas (Middleware Next.js)

```typescript
// src/middleware.ts (ou middleware.js)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rotas admin
  if (pathname.startsWith("/observability") || pathname.startsWith("/admin")) {
    const token = request.cookies.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Verificar role no token JWT (decodificar sem validação completa para speed)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/judge", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/observability/:path*", "/admin/:path*"],
};
```

---

## 2. LANDING PAGE PARA LEIGOS

### Requisitos
- URL: `judgetcg.com.br/` (root)
- Público: jogadores casuais, não técnicos
- Tom: acolhedor, simples, sem jargão (sem "RAG", "embeddings", "pgvector", etc.)
- CTA claro: "Consultar Regras" → leva ao login → redireciona para /judge
- Login Google OAuth (zero fricção, sem confirmação de email)

### Estrutura da Página

```
[Logo Judge TCG]
"Não sabe se pode fazer aquela jogada? Pergunte ao juiz virtual."
[🎮 Escolha seu jogo] [🧠 Faça sua pergunta] [⚖️ Receba o veredito]
[🔍 Consultar Regras] ← CTA principal
[Continuar com Google] ← Login OAuth
"Já usou antes? Suas perguntas ficam salvas."
Jogos suportados: [MTG] [Pokémon] ...
"Mais de 10.000 regras indexadas"
[Como funciona?] [Sobre]
```

### Implementação

#### Página: `src/app/page.tsx` (nova)

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/useAuth";
import { GameMatSelector } from "@/components/landing/GameMatSelector";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();

  const handleConsultar = () => {
    if (user) {
      router.push("/judge");
    } else {
      document.getElementById("login-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Judge <span className="text-amber-400">TCG</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-4">
            Não sabe se pode fazer aquela jogada?
          </p>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
            Pergunte ao juiz virtual. Receba o veredito em segundos, com base nas regras oficiais do seu jogo.
          </p>

          <button onClick={handleConsultar}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg shadow-amber-500/25">
            🔍 Consultar Regras
          </button>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Como Funciona</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard icon="🎮" title="Escolha seu jogo" description="Magic, Pokémon, Yu-Gi-Oh! e mais. Selecione o TCG que está jogando." />
          <FeatureCard icon="🧠" title="Faça sua pergunta" description='"Posso ativar essa habilidade?" Pergunte em português.' />
          <FeatureCard icon="⚖️" title="Receba o veredito" description="Permitido, Não permitido, ou Depende. Com explicação clara e fonte oficial." />
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Jogos Suportados</h2>
        <GameMatSelector variant="compact" />
        <p className="text-center text-slate-400 mt-6">Mais de 10.000 regras oficiais indexadas e atualizadas.</p>
      </section>

      <section id="login-section" className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white text-center mb-4">Comece a Consultar</h2>
          <p className="text-slate-400 text-center mb-6">Entre com sua conta Google. Sem senhas, sem complicação.</p>
          <GoogleLoginButton onSuccess={() => router.push("/judge")} redirectTo="/judge" />
          <p className="text-xs text-slate-500 text-center mt-4">
            Ao entrar, você aceita nossos <a href="/privacidade" className="text-amber-400 hover:underline">Termos de Privacidade</a>.
          </p>
        </div>
      </section>

      <footer className="container mx-auto px-4 py-8 text-center text-slate-500">
        <p>© 2026 Judge TCG. Não afiliado às empresas dos jogos.</p>
      </footer>
    </div>
  );
}
```

#### Componente: `GoogleLoginButton`

```tsx
"use client";

import { useAuth } from "./useAuth";

interface GoogleLoginButtonProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

export function GoogleLoginButton({ redirectTo = "/judge", onSuccess }: GoogleLoginButtonProps) {
  const { signIn } = useAuth();

  const handleLogin = async () => {
    try {
      await signIn("google", { options: { redirectTo: `${window.location.origin}${redirectTo}` } });
      onSuccess?.();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <button onClick={handleLogin}
      className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-medium py-3 px-4 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200">
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continuar com Google
    </button>
  );
}
```

#### Configuração Supabase Auth

```sql
-- Desabilitar confirmação de email para Google OAuth
UPDATE auth.providers SET confirm_email = false WHERE provider = 'google';

-- Auto-confirmar usuários Google
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.provider = 'google' THEN
    NEW.email_confirmed_at := NOW();
    NEW.raw_user_meta_data := jsonb_set(COALESCE(NEW.raw_user_meta_data, '{}'::jsonb), '{email_verified}', 'true'::jsonb);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 3. INGESTÃO DE PDF — SWU

### Fluxo
```
Admin → Console → Upload PDF SWU → Parsing → Chunking → Embeddings → Indexação → rag_ready=true
```

### Backend

```python
@router.post("/runtime/admin/ingestion/upload/{game_slug}", status_code=202)
async def upload_pdf_rules(
    game_slug: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    user=Depends(require_role("admin")),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Apenas arquivos PDF são aceitos")
    if file.size > 50 * 1024 * 1024:
        raise HTTPException(400, "Arquivo excede 50MB")

    temp_path = f"/tmp/ingestion/{game_slug}_{uuid4()}.pdf"
    os.makedirs("/tmp/ingestion", exist_ok=True)

    with open(temp_path, "wb") as f:
        f.write(await file.read())

    job_id = await db.fetchval(
        "INSERT INTO tcg_judge.ingestion_jobs (game_slug, status, stage, started_by) VALUES ($1, 'pending', 'uploaded', $2) RETURNING id",
        game_slug, user.id
    )

    background_tasks.add_task(process_pdf_ingestion, job_id, game_slug, temp_path)
    return {"job_id": job_id, "status": "pending", "message": f"PDF recebido. Processamento iniciado para {game_slug}."}
```

### Frontend

```tsx
export default function IngestionAdminPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [activeJob, setActiveJob] = useState<string | null>(null);

  if (!isAdmin) { router.push("/judge"); return null; }

  const handleUpload = async (file: File, gameSlug: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/proxy/runtime/admin/ingestion/upload/${gameSlug}`, {
      method: "POST", body: formData, headers: { Authorization: `Bearer ${user?.access_token}` },
    });
    const data = await response.json();
    if (data.job_id) setActiveJob(data.job_id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Console de Ingestão</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Upload de Regras — SWU</h2>
          <UploadDropzone accept=".pdf" maxSize={50 * 1024 * 1024} onUpload={(file) => handleUpload(file, "swu")} />
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Progresso</h2>
          {activeJob ? <IngestionProgress jobId={activeJob} /> : <p className="text-slate-500">Nenhum processamento ativo.</p>}
        </div>
      </div>
    </div>
  );
}
```

---

## 4. LOGOS CUSTOMIZADOS

### Mapeamento

```typescript
export const TCG_LOGOS: Record<string, { src: string; alt: string }> = {
  mtg: { src: "/logos/magic-the-gathering.svg", alt: "Magic: The Gathering" },
  pokemon: { src: "/logos/pokemon-tcg.svg", alt: "Pokémon TCG" },
  yugioh: { src: "/logos/yu-gi-oh.svg", alt: "Yu-Gi-Oh!" },
  lorcana: { src: "/logos/lorcana.svg", alt: "Disney Lorcana" },
  onepiece: { src: "/logos/one-piece.svg", alt: "One Piece Card Game" },
  fab: { src: "/logos/flesh-and-blood.svg", alt: "Flesh and Blood" },
  digimon: { src: "/logos/digimon.svg", alt: "Digimon TCG" },
  gundam: { src: "/logos/gundam.svg", alt: "Gundam Card Game" },
  dbfw: { src: "/logos/dragon-ball.svg", alt: "Dragon Ball Fusion World" },
  sorcery: { src: "/logos/sorcery.svg", alt: "Sorcery: Contested Realm" },
  vanguard: { src: "/logos/cardfight-vanguard.svg", alt: "Cardfight!! Vanguard" },
  riftbound: { src: "/logos/riftbound.svg", alt: "Riftbound" },
  union_arena: { src: "/logos/union-arena.svg", alt: "Union Arena" },
  swu: { src: "/logos/star-wars-unlimited.svg", alt: "Star Wars Unlimited" },
};
```

### GameMatSelector com Logos

```tsx
export function GameMatSelector({ selectedGame, onSelect, variant = "default" }: GameMatSelectorProps) {
  const games = useGames();

  return (
    <div className={`grid gap-4 ${variant === "compact" ? "grid-cols-4 md:grid-cols-7" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
      {games.map((game) => (
        <motion.button key={game.slug} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(game.slug)}
          className={`relative rounded-xl p-4 transition-all ${selectedGame === game.slug ? "ring-2 ring-amber-400 bg-slate-700" : "bg-slate-800 hover:bg-slate-700"} ${!game.rag_ready ? "opacity-60" : ""}`}>
          <div className="relative w-full aspect-square mb-2">
            <Image src={TCG_LOGOS[game.slug]?.src || "/logos/default-tcg.svg"} alt={game.name} fill className="object-contain p-2" sizes={variant === "compact" ? "64px" : "128px"} />
          </div>
          <p className={`text-center font-medium ${variant === "compact" ? "text-xs" : "text-sm"} text-white`}>{game.name}</p>
          {game.beta && <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-slate-900 text-[10px] font-bold rounded">BETA</span>}
          {!game.rag_ready && <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-600 text-slate-300 text-[10px] rounded">Em breve</span>}
        </motion.button>
      ))}
    </div>
  );
}
```

### Diretório de Logos

```
frontend/runtime_console_v3/public/logos/
├── magic-the-gathering.svg
├── pokemon-tcg.svg
├── yu-gi-oh.svg
├── lorcana.svg
├── one-piece.svg
├── flesh-and-blood.svg
├── digimon.svg
├── gundam.svg
├── dragon-ball.svg
├── sorcery.svg
├── cardfight-vanguard.svg
├── riftbound.svg
├── union-arena.svg
├── star-wars-unlimited.svg
└── default-tcg.svg
```

---

## 5. FLUXO DO USUÁRIO

```
Visitante → judgetcg.com.br/ → Landing Page
  → "Consultar Regras" ou "Continuar com Google"
    → Login Google (sem confirmação) → /judge
      → Seleciona jogo (logos) → Pergunta → Veredito

Admin → /admin/console (role === "admin")
  → Métricas, Console, Ingestão
  → Upload PDF SWU → Processamento → Ativação
```

---

## 6. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: RBAC + Landing Page (1 semana)
- [ ] useAuth retornar role
- [ ] useUserRole hook
- [ ] isAdmin condicional nos botões
- [ ] Middleware Next.js para rotas admin
- [ ] page.tsx landing page
- [ ] FeatureCard, GameMatSelector compact
- [ ] GoogleLoginButton simplificado
- [ ] Supabase auto-confirmar Google
- [ ] Testar fluxo landing → login → /judge

### Fase 2: Logos (2-3 dias)
- [ ] Converter logos para SVG
- [ ] Copiar para public/logos/
- [ ] tcg-logos.ts
- [ ] Atualizar GameMatSelector com Image
- [ ] Testar responsivo

### Fase 3: Ingestão SWU (1 semana)
- [ ] Endpoint upload PDF
- [ ] Background task processamento
- [ ] Página /admin/ingestion
- [ ] UploadDropzone, IngestionProgress
- [ ] Testar upload → ativação

### Fase 4: Integração (3-4 dias)
- [ ] Testes E2E
- [ ] Lighthouse landing page
- [ ] Testes Vitest
- [ ] Documentação

---

## 7. ARQUIVOS

### Backend
```
services/api/app/
├── api/v1/runtime_judge.py          # GET /me
├── api/v1/admin_ingestion.py        # Upload PDF
├── core/security/rbac.py            # Verificar require_role
└── judge/registry.py                # activate_game
```

### Frontend
```
frontend/runtime_console_v3/src/
├── app/page.tsx                     # Landing page
├── app/admin/ingestion/page.tsx     # Console ingestão
├── features/auth/
│   ├── useAuth.ts                   # + role
│   └── GoogleLoginButton.tsx        # Novo
├── components/layout/Header.tsx     # + isAdmin
├── components/landing/
│   ├── FeatureCard.tsx
│   └── HeroSection.tsx
├── components/admin/
│   ├── UploadDropzone.tsx
│   └── IngestionProgress.tsx
├── hooks/useUserRole.ts
├── lib/tcg-logos.ts
└── middleware.ts                    # Proteção admin
```

### Assets
```
public/logos/                        # 15 SVGs
```

### Supabase
```sql
-- 20260602000001_auto_confirm_google.sql
```
