import { createHttpClient, type HttpClient } from "@/src/api/client";
import { createAuthApiClient, type AuthApiClient } from "@/src/api/auth.client";
import { createPublicApiClient, type PublicApiClient } from "@/src/api/public.client";
import {
  createMarketplaceApiClient,
  type MarketplaceApiClient,
} from "@/src/api/marketplace.client";
import { createCheckoutApiClient, type CheckoutApiClient } from "@/src/api/checkout.client";
import { getAccessToken } from "@/src/auth/session";

export interface ApiClients {
  http: HttpClient;
  authApi: AuthApiClient;
  publicApi: PublicApiClient;
  marketplaceApi: MarketplaceApiClient;
  checkoutApi: CheckoutApiClient;
}

let singleton: ApiClients | null = null;

export function getApiClients(): ApiClients {
  if (singleton) return singleton;

  const http = createHttpClient({
    getAccessToken: () => getAccessToken(),
  });

  singleton = {
    http,
    authApi: createAuthApiClient(http),
    publicApi: createPublicApiClient(http),
    marketplaceApi: createMarketplaceApiClient(http),
    checkoutApi: createCheckoutApiClient(http),
  };

  return singleton;
}

/** Vitest helper */
export function __resetApiClientsForTests(): void {
  singleton = null;
}
