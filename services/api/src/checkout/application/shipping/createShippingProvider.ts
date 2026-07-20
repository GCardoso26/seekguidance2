import type {
  ShippingProvider,
  ShippingProviderName,
  ShippingQuoteInput,
  ShippingQuoteOption,
  ShippingTrackEvent,
  ShippingTrackInput,
} from "./ShippingProvider.js";
import { MelhorEnvioShippingProvider } from "./MelhorEnvioShippingProvider.js";

/** Local/dev quotes — deterministic. */
export class StubShippingProvider implements ShippingProvider {
  readonly name = "stub";

  async quote(input: ShippingQuoteInput): Promise<ShippingQuoteOption[]> {
    const base = Math.max(800, Math.round(input.weightGrams * 0.15));
    return [
      {
        provider: this.name,
        serviceCode: "PAC",
        serviceName: "PAC Stub",
        priceCents: base,
        daysMin: 5,
        daysMax: 12,
        trackingSupported: true,
      },
      {
        provider: this.name,
        serviceCode: "SEDEX",
        serviceName: "SEDEX Stub",
        priceCents: base * 2,
        daysMin: 1,
        daysMax: 3,
        trackingSupported: true,
      },
    ];
  }

  async track(_input: ShippingTrackInput): Promise<ShippingTrackEvent[]> {
    return [
      {
        at: new Date().toISOString(),
        description: "Objeto em trânsito (stub)",
        location: "Hub JudgeTCG",
      },
    ];
  }
}

/** Skeleton — Correios / Jadlog / Kangu until credentials wired. */
export class SkeletonShippingProvider implements ShippingProvider {
  constructor(readonly name: Exclude<ShippingProviderName, "stub" | "melhor_envio">) {}

  async quote(_input: ShippingQuoteInput): Promise<ShippingQuoteOption[]> {
    throw new Error(`shipping_provider_skeleton:${this.name}`);
  }

  async track(_input: ShippingTrackInput): Promise<ShippingTrackEvent[]> {
    throw new Error(`shipping_provider_skeleton:${this.name}`);
  }
}

export function createShippingProvider(
  name: ShippingProviderName | string = "stub",
): ShippingProvider {
  switch (name) {
    case "stub":
      return new StubShippingProvider();
    case "melhor_envio":
      return new MelhorEnvioShippingProvider();
    case "correios":
    case "jadlog":
    case "kangu":
      return new SkeletonShippingProvider(name);
    default:
      throw new Error(`shipping_provider_unknown:${name}`);
  }
}
