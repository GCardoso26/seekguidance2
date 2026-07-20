import type {
  ShippingProvider,
  ShippingQuoteInput,
  ShippingQuoteOption,
  ShippingTrackEvent,
  ShippingTrackInput,
} from "./ShippingProvider.js";

const SANDBOX_BASE = "https://sandbox.melhorenvio.com.br";
const PRODUCTION_BASE = "https://melhorenvio.com.br";

/**
 * Melhor Envio adapter — implements ShippingProvider port.
 * Token: MELHOR_ENVIO_TOKEN. Sandbox default: MELHOR_ENVIO_SANDBOX≠false.
 */
export class MelhorEnvioShippingProvider implements ShippingProvider {
  readonly name = "melhor_envio";

  constructor(
    private readonly token = process.env.MELHOR_ENVIO_TOKEN ?? "",
    private readonly sandbox = process.env.MELHOR_ENVIO_SANDBOX !== "false",
    private readonly fromPostal =
      process.env.MELHOR_ENVIO_FROM_POSTAL?.replace(/\D/g, "") || "01310100",
  ) {
    if (!this.token) {
      throw new Error("melhor_envio_token_missing");
    }
  }

  private base(): string {
    return this.sandbox ? SANDBOX_BASE : PRODUCTION_BASE;
  }

  private async request(path: string, body?: Record<string, unknown>): Promise<unknown> {
    const res = await fetch(`${this.base()}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "JudgeTCG (contato@judgetcg.com.br)",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`melhor_envio_api_error:${res.status}:${text.slice(0, 200)}`);
    }
    if (res.status === 204) return {};
    return res.json();
  }

  async quote(input: ShippingQuoteInput): Promise<ShippingQuoteOption[]> {
    const weightKg = Math.max(0.1, input.weightGrams / 1000);
    const payload = {
      from: { postal_code: input.originCep.replace(/\D/g, "") || this.fromPostal },
      to: { postal_code: input.destinationCep.replace(/\D/g, "") },
      products: [
        {
          id: "checkout-item",
          width: input.widthCm ?? 16,
          height: input.heightCm ?? 4,
          length: input.lengthCm ?? 24,
          weight: weightKg,
          insurance_value: (input.declaredValueCents ?? 0) / 100,
          quantity: 1,
        },
      ],
    };
    const raw = await this.request("/api/v2/me/shipment/calculate", payload);
    const list = Array.isArray(raw) ? raw : [];
    return list
      .filter((row) => row && typeof row === "object" && !(row as { error?: string }).error)
      .map((row) => {
        const r = row as Record<string, unknown>;
        const company = r.company as { name?: string } | undefined;
        const price = Number(r.custom_price ?? r.price ?? 0);
        const days = Number(r.custom_delivery_time ?? r.delivery_time ?? 0);
        return {
          provider: this.name,
          serviceCode: String(r.id ?? r.name ?? "me"),
          serviceName: `${company?.name ?? "ME"} ${String(r.name ?? "")}`.trim(),
          priceCents: Math.round(price * 100),
          daysMin: Math.max(1, days),
          daysMax: Math.max(1, days + 2),
          trackingSupported: true,
        } satisfies ShippingQuoteOption;
      })
      .filter((q) => q.priceCents > 0);
  }

  async track(input: ShippingTrackInput): Promise<ShippingTrackEvent[]> {
    // Melhor Envio tracking via order id when available
    const order = (await this.request(
      `/api/v2/me/orders/${encodeURIComponent(input.trackingCode)}`,
    )) as Record<string, unknown>;
    const tracking = order.tracking as string | undefined;
    const status = String(order.status ?? "unknown");
    return [
      {
        at: new Date().toISOString(),
        description: `Status Melhor Envio: ${status}`,
        location: tracking ?? undefined,
      },
    ];
  }
}
