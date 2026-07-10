"use client";

import { useEffect, useState } from "react";

const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Celular" },
  { value: "random", label: "Chave aleatória" },
] as const;

type Props = {
  storeId: string;
  store?: Record<string, unknown>;
  onSaved?: () => void;
};

function placeholder(type: string) {
  switch (type) {
    case "cpf":
      return "123.456.789-00";
    case "cnpj":
      return "12.345.678/0001-00";
    case "email":
      return "sua@loja.com";
    case "phone":
      return "+5511987654321";
    default:
      return "00020126...";
  }
}

export function PixConfigForm({ storeId, store, onSaved }: Props) {
  const [keyType, setKeyType] = useState(String(store?.pix_key_type ?? "cpf"));
  const [key, setKey] = useState(String(store?.pix_key ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (store?.pix_key_type) setKeyType(String(store.pix_key_type));
    if (store?.pix_key) setKey(String(store.pix_key));
  }, [store?.pix_key, store?.pix_key_type]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/payment-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pix_key_type: keyType,
          pix_key: key.trim(),
          payment_method_preference: "pix",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) throw new Error(String(data.detail ?? "Falha ao salvar PIX"));
      setSuccess(true);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar PIX");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6">
      <h2 className="font-semibold text-emerald-100">PIX direto (recomendado)</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Receba pagamentos direto na sua conta. Zero comissão da Judge TCG sobre vendas.
      </p>

      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="text-muted-foreground">Tipo de chave</span>
          <select
            value={keyType}
            onChange={(e) => setKeyType(e.target.value)}
            className="mt-1 w-full surface-card rounded-lg px-3 py-2"
          >
            {PIX_KEY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-muted-foreground">Chave PIX</span>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={placeholder(keyType)}
            className="mt-1 w-full surface-card rounded-lg px-3 py-2"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving || !key.trim()}
        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Salvando…" : store?.pix_key ? "Atualizar PIX" : "Salvar PIX"}
      </button>

      {success && <p className="mt-3 text-sm text-emerald-300">PIX configurado! Sua loja já pode vender no marketplace.</p>}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}
