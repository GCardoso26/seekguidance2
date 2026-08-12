"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineLoading } from "@/components/ui/async-state";
import { AccreditationStatusView } from "@/components/seller-accreditation/AccreditationStatusView";
import {
  AGREEMENT_KEYS,
  CATEGORY_OPTIONS,
  CHANNEL_OPTIONS,
  ORDERS_BANDS,
  RELATION_OPTIONS,
  SKU_BANDS,
  SYNC_METHODS,
  TCG_OPTIONS,
  UF_OPTIONS,
  WIZARD_STEPS,
  type AccreditationAnswers,
  type AccreditationApplication,
  formatCnpjInput,
  formatCpfInput,
  onlyDigits,
} from "@/lib/seller-accreditation";

function toggleInList(list: string[] | undefined, id: string): string[] {
  const cur = list ?? [];
  return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm text-foreground/90">{children}</label>;
}

export function AccreditationWizard() {
  const router = useRouter();
  const { user, loading: authLoading } = useJudgeAuth();
  const [app, setApp] = useState<AccreditationApplication | null>(null);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<AccreditationAnswers>({});
  const [busy, setBusy] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  const boot = useCallback(async () => {
    setBootError(null);
    try {
      let res = await fetch("/api/vender/credenciamento", { cache: "no-store" });
      if (res.status === 401) {
        router.replace(`/entrar?intent=sell&next=${encodeURIComponent("/vender/credenciamento")}`);
        return;
      }
      let data = (await res.json()) as { application?: AccreditationApplication | null; detail?: string };
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Falha ao carregar");

      if (!data.application || data.application.status === "rejected") {
        res = await fetch("/api/vender/credenciamento", { method: "POST" });
        data = (await res.json()) as { application?: AccreditationApplication | null; detail?: string };
        if (!res.ok || !data.application) {
          throw new Error(typeof data.detail === "string" ? data.detail : "Falha ao iniciar pedido");
        }
      }

      const application = data.application!;
      setApp(application);
      setAnswers(application.answers || {});
      if (application.awaiting_review || application.status === "approved") {
        setStep(8);
      } else {
        setStep(Math.min(7, Math.max(1, application.current_step || 1)));
      }
    } catch (err) {
      setBootError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/entrar?intent=sell&next=${encodeURIComponent("/vender/credenciamento")}`);
      return;
    }
    void boot();
  }, [authLoading, user, boot, router]);

  useEffect(() => {
    if (step !== 2) return;
    if (answers.cnpj_lookup) return;
    if (onlyDigits(answers.store?.cnpj || "").length !== 14) return;
    void lookupCnpj();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao entrar no passo 2
  }, [step]);

  async function save(partial: AccreditationAnswers, nextStep: number) {
    if (!app) return null;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/vender/credenciamento/${encodeURIComponent(app.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: partial, current_step: nextStep }),
      });
      const data = (await res.json()) as { application?: AccreditationApplication; detail?: unknown };
      if (!res.ok) {
        const detail = data.detail;
        throw new Error(typeof detail === "string" ? detail : "Não foi possível salvar");
      }
      const updated = data.application!;
      setApp(updated);
      setAnswers(updated.answers || {});
      setStep(nextStep);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function lookupCnpj() {
    const cnpj = answers.store?.cnpj || "";
    if (onlyDigits(cnpj).length !== 14) {
      setError("Informe um CNPJ válido");
      return;
    }
    setLookupBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/cnpj-lookup?cnpj=${encodeURIComponent(cnpj)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Consulta falhou");
      setAnswers((prev) => ({
        ...prev,
        cnpj_lookup: data,
        cnpj_confirmed: false,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na consulta CNPJ");
    } finally {
      setLookupBusy(false);
    }
  }

  async function submit() {
    if (!app) return;
    setBusy(true);
    setError(null);
    try {
      const patchRes = await fetch(`/api/vender/credenciamento/${encodeURIComponent(app.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, current_step: 7 }),
      });
      const patchData = (await patchRes.json()) as {
        application?: AccreditationApplication;
        detail?: unknown;
      };
      if (!patchRes.ok) {
        throw new Error(
          typeof patchData.detail === "string" ? patchData.detail : "Não foi possível salvar",
        );
      }
      const res = await fetch(`/api/vender/credenciamento/${encodeURIComponent(app.id)}/submit`, {
        method: "POST",
      });
      const data = (await res.json()) as { application?: AccreditationApplication; detail?: unknown };
      if (!res.ok) {
        const detail = data.detail;
        throw new Error(typeof detail === "string" ? detail : "Falha ao enviar");
      }
      setApp(data.application!);
      setAnswers(data.application!.answers || {});
      setStep(8);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || (!app && !bootError)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <InlineLoading message="Preparando credenciamento…" />
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-danger">{bootError}</p>
        <Button className="mt-4" onClick={() => void boot()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!app) return null;

  if (step >= 8 || app.awaiting_review || app.status === "approved") {
    return <AccreditationStatusView application={app} />;
  }

  const store = answers.store || {};
  const responsible = answers.responsible || {};
  const profile = answers.profile || {};
  const evidence = answers.evidence || {};
  const operations = answers.operations || {};
  const agreements = answers.agreements || {};
  const lookup = answers.cnpj_lookup;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Link href="/vender" className="text-sm text-muted-foreground hover:text-foreground">
        ← Vender no JudgeTCG
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Solicitar credenciamento</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Hobby store com CNPJ. Isso não é um cadastro instantâneo de vendedor.
      </p>

      <ol className="mt-6 flex flex-wrap gap-2">
        {WIZARD_STEPS.map((s) => (
          <li
            key={s.id}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              s.id === step
                ? "border-primary bg-primary/10 text-foreground"
                : s.id < step
                  ? "border-border text-foreground"
                  : "border-border/60 text-muted-foreground"
            }`}
          >
            {s.id}. {s.title}
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-4">
        {step === 1 && (
          <>
            <div>
              <FieldLabel>Nome comercial *</FieldLabel>
              <Input
                value={store.name || ""}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, store: { ...p.store, name: e.target.value } }))
                }
                placeholder="Ex.: Card Game Store"
              />
            </div>
            <div>
              <FieldLabel>CNPJ *</FieldLabel>
              <Input
                value={store.cnpj || ""}
                onChange={(e) =>
                  setAnswers((p) => ({
                    ...p,
                    store: { ...p.store, cnpj: formatCnpjInput(e.target.value) },
                    cnpj_confirmed: false,
                  }))
                }
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <FieldLabel>Site da loja</FieldLabel>
              <Input
                value={store.site || ""}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, store: { ...p.store, site: e.target.value } }))
                }
                placeholder="https://"
              />
            </div>
            <div>
              <FieldLabel>Instagram</FieldLabel>
              <Input
                value={store.instagram || ""}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, store: { ...p.store, instagram: e.target.value } }))
                }
                placeholder="@sua_loja"
              />
            </div>
            <div>
              <FieldLabel>WhatsApp comercial</FieldLabel>
              <Input
                value={store.whatsapp || ""}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, store: { ...p.store, whatsapp: e.target.value } }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Cidade</FieldLabel>
                <Input
                  value={store.city || ""}
                  onChange={(e) =>
                    setAnswers((p) => ({ ...p, store: { ...p.store, city: e.target.value } }))
                  }
                />
              </div>
              <div>
                <FieldLabel>UF</FieldLabel>
                <select
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  value={store.state || "SP"}
                  onChange={(e) =>
                    setAnswers((p) => ({ ...p, store: { ...p.store, state: e.target.value } }))
                  }
                >
                  {UF_OPTIONS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm">Você representa</legend>
              {(
                [
                  ["physical", "Loja física"],
                  ["online", "Loja online"],
                  ["both", "Loja física + online"],
                ] as const
              ).map(([id, label]) => (
                <label key={id} className="mb-2 flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="presence"
                    checked={(store.presence || "both") === id}
                    onChange={() =>
                      setAnswers((p) => ({ ...p, store: { ...p.store, presence: id } }))
                    }
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <Button
              disabled={busy}
              onClick={() => {
                if (!store.name || onlyDigits(store.cnpj || "").length !== 14) {
                  setError("Nome e CNPJ válidos são obrigatórios");
                  return;
                }
                void save({ store: { ...store, state: store.state || "SP", presence: store.presence || "both" } }, 2);
              }}
            >
              Continuar
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-muted-foreground">
              Consultamos o CNPJ automaticamente. Confirme se os dados representam sua loja — isso não
              aprova o credenciamento.
            </p>
            <div className="flex gap-2">
              <Input value={store.cnpj || ""} readOnly className="flex-1" />
              <Button type="button" variant="outline" disabled={lookupBusy} onClick={() => void lookupCnpj()}>
                {lookupBusy ? "Consultando…" : "Consultar"}
              </Button>
            </div>
            {lookup && (
              <div className="rounded-xl border border-border bg-card/60 p-4 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Empresa encontrada</p>
                <p className="mt-2 text-lg font-semibold">
                  {String(lookup.razao_social || lookup.nome_fantasia || "—")}
                </p>
                <p className="mt-1 text-muted-foreground">CNPJ: {String(lookup.cnpj || store.cnpj)}</p>
                <p className="mt-1">
                  Situação: {String(lookup.descricao_situacao_cadastral || "—")}
                </p>
                {lookup.nome_fantasia ? (
                  <p className="mt-1">Nome fantasia: {String(lookup.nome_fantasia)}</p>
                ) : null}
                <p className="mt-1">
                  {[lookup.municipio, lookup.uf].filter(Boolean).join(" — ") || "—"}
                </p>
                {lookup.cnae_fiscal_descricao ? (
                  <p className="mt-2 text-xs text-muted-foreground">{String(lookup.cnae_fiscal_descricao)}</p>
                ) : null}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                disabled={busy || !lookup}
                onClick={() =>
                  void save(
                    {
                      cnpj_lookup: lookup,
                      cnpj_confirmed: true,
                      store,
                    },
                    3,
                  )
                }
              >
                Confirmar empresa
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <fieldset>
              <legend className="mb-2 text-sm">Relação com a loja *</legend>
              {RELATION_OPTIONS.map((opt) => (
                <label key={opt.id} className="mb-2 flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="relation"
                    checked={responsible.relation === opt.id}
                    onChange={() =>
                      setAnswers((p) => ({
                        ...p,
                        responsible: { ...p.responsible, relation: opt.id },
                      }))
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </fieldset>
            <div>
              <FieldLabel>Nome completo *</FieldLabel>
              <Input
                value={responsible.full_name || ""}
                onChange={(e) =>
                  setAnswers((p) => ({
                    ...p,
                    responsible: { ...p.responsible, full_name: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <FieldLabel>CPF *</FieldLabel>
              <Input
                value={responsible.cpf || ""}
                onChange={(e) =>
                  setAnswers((p) => ({
                    ...p,
                    responsible: { ...p.responsible, cpf: formatCpfInput(e.target.value) },
                  }))
                }
              />
            </div>
            <div>
              <FieldLabel>E-mail profissional *</FieldLabel>
              <Input
                type="email"
                value={responsible.email || ""}
                onChange={(e) =>
                  setAnswers((p) => ({
                    ...p,
                    responsible: { ...p.responsible, email: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <FieldLabel>Telefone</FieldLabel>
              <Input
                value={responsible.phone || ""}
                onChange={(e) =>
                  setAnswers((p) => ({
                    ...p,
                    responsible: { ...p.responsible, phone: e.target.value },
                  }))
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  if (
                    !responsible.relation ||
                    !responsible.full_name ||
                    onlyDigits(responsible.cpf || "").length !== 11 ||
                    !responsible.email?.includes("@")
                  ) {
                    setError("Preencha relação, nome, CPF e e-mail");
                    return;
                  }
                  void save({ responsible }, 4);
                }}
              >
                Continuar
              </Button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">TCGs que você comercializa *</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TCG_OPTIONS.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(profile.tcgs || []).includes(opt.id)}
                      onChange={() =>
                        setAnswers((p) => ({
                          ...p,
                          profile: { ...p.profile, tcgs: toggleInList(p.profile?.tcgs, opt.id) },
                        }))
                      }
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">O que você vende *</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CATEGORY_OPTIONS.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(profile.categories || []).includes(opt.id)}
                      onChange={() =>
                        setAnswers((p) => ({
                          ...p,
                          profile: {
                            ...p.profile,
                            categories: toggleInList(p.profile?.categories, opt.id),
                          },
                        }))
                      }
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Onde você vende atualmente</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CHANNEL_OPTIONS.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(profile.channels || []).includes(opt.id)}
                      onChange={() =>
                        setAnswers((p) => ({
                          ...p,
                          profile: {
                            ...p.profile,
                            channels: toggleInList(p.profile?.channels, opt.id),
                          },
                        }))
                      }
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                Voltar
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  if (!(profile.tcgs || []).length || !(profile.categories || []).length) {
                    setError("Selecione ao menos um TCG e uma categoria");
                    return;
                  }
                  void save({ profile }, 5);
                }}
              >
                Continuar
              </Button>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <p className="text-sm text-muted-foreground">
              Mostre que sua loja existe — pelo menos uma evidência. Fotos: cole até 3 URLs.
            </p>
            {(
              [
                ["site", "Site oficial"],
                ["instagram", "Instagram comercial"],
                ["google_business", "Google Business Profile"],
                ["marketplace", "Marketplace existente"],
                ["document_url", "Documento comercial (URL)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <FieldLabel>{label}</FieldLabel>
                <Input
                  value={String(evidence[key] || "")}
                  onChange={(e) =>
                    setAnswers((p) => ({
                      ...p,
                      evidence: { ...p.evidence, [key]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
            <div>
              <FieldLabel>Fotos (URLs, uma por linha)</FieldLabel>
              <textarea
                className="min-h-[88px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                value={(evidence.photos || []).join("\n")}
                onChange={(e) =>
                  setAnswers((p) => ({
                    ...p,
                    evidence: {
                      ...p.evidence,
                      photos: e.target.value
                        .split("\n")
                        .map((x) => x.trim())
                        .filter(Boolean)
                        .slice(0, 3),
                    },
                  }))
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(4)}>
                Voltar
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  const has =
                    evidence.site ||
                    evidence.instagram ||
                    evidence.google_business ||
                    evidence.marketplace ||
                    evidence.document_url ||
                    (evidence.photos || []).length ||
                    store.site ||
                    store.instagram;
                  if (!has) {
                    setError("Informe ao menos uma evidência");
                    return;
                  }
                  void save({ evidence }, 6);
                }}
              >
                Continuar
              </Button>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">SKUs aproximados *</legend>
              {SKU_BANDS.map((opt) => (
                <label key={opt.id} className="mb-2 flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="sku"
                    checked={operations.sku_band === opt.id}
                    onChange={() =>
                      setAnswers((p) => ({
                        ...p,
                        operations: { ...p.operations, sku_band: opt.id },
                      }))
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Pedidos / mês *</legend>
              {ORDERS_BANDS.map((opt) => (
                <label key={opt.id} className="mb-2 flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="orders"
                    checked={operations.orders_band === opt.id}
                    onChange={() =>
                      setAnswers((p) => ({
                        ...p,
                        operations: { ...p.operations, orders_band: opt.id },
                      }))
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Estoque integrado?</legend>
              <label className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="stock"
                  checked={operations.stock_integrated === true}
                  onChange={() =>
                    setAnswers((p) => ({
                      ...p,
                      operations: { ...p.operations, stock_integrated: true },
                    }))
                  }
                />
                Sim
              </label>
              <label className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="stock"
                  checked={operations.stock_integrated === false}
                  onChange={() =>
                    setAnswers((p) => ({
                      ...p,
                      operations: { ...p.operations, stock_integrated: false },
                    }))
                  }
                />
                Não
              </label>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Atualização de estoque *</legend>
              {SYNC_METHODS.map((opt) => (
                <label key={opt.id} className="mb-2 flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="sync"
                    checked={operations.sync_method === opt.id}
                    onChange={() =>
                      setAnswers((p) => ({
                        ...p,
                        operations: { ...p.operations, sync_method: opt.id },
                      }))
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(5)}>
                Voltar
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  if (!operations.sku_band || !operations.orders_band || !operations.sync_method) {
                    setError("Complete SKUs, pedidos e método de sync");
                    return;
                  }
                  void save({ operations }, 7);
                }}
              >
                Continuar
              </Button>
            </div>
          </>
        )}

        {step === 7 && (
          <>
            <div className="rounded-xl border border-border bg-card/50 p-4 text-sm">
              <p className="font-medium">{store.name}</p>
              <p className="mt-1 text-muted-foreground">CNPJ {store.cnpj}</p>
              <p className="mt-2 text-muted-foreground">
                {(profile.categories || []).join(" · ") || "—"}
              </p>
              <p className="text-muted-foreground">
                {(profile.tcgs || [])
                  .map((id) => TCG_OPTIONS.find((t) => t.id === id)?.label || id)
                  .join(" · ") || "—"}
              </p>
              <p className="mt-2 text-muted-foreground">
                Operação:{" "}
                {store.presence === "physical"
                  ? "Loja física"
                  : store.presence === "online"
                    ? "Loja online"
                    : "Física + online"}
              </p>
              {app.trust_score_initial > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Trust score inicial (indicativo): {app.trust_score_initial}
                </p>
              )}
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Você concorda em:</legend>
              {AGREEMENT_KEYS.map((item) => (
                <label key={item.id} className="mb-2 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(agreements[item.id])}
                    onChange={(e) =>
                      setAnswers((p) => ({
                        ...p,
                        agreements: { ...p.agreements, [item.id]: e.target.checked },
                      }))
                    }
                  />
                  {item.label}
                </label>
              ))}
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(6)}>
                Voltar
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  if (!AGREEMENT_KEYS.every((k) => agreements[k.id])) {
                    setError("Aceite todas as regras para enviar");
                    return;
                  }
                  void submit();
                }}
              >
                {busy ? "Enviando…" : "Enviar para análise"}
              </Button>
            </div>
          </>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
