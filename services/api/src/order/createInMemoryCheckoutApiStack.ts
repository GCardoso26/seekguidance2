import { createInMemoryIdentityStack } from "../identity/createInMemoryIdentityStack.js";
import { createInMemoryMarketplaceStack } from "../marketplace/createInMemoryMarketplaceStack.js";
import { OnboardSellerApplicationService } from "../identity/application/OnboardSellerApplicationService.js";
import {
  createAuthenticatedApiServer,
  listenAuthenticatedApi,
  type AuthenticatedApiDeps,
} from "../identity/http/createAuthenticatedApiServer.js";
import { createInMemoryOrderStack } from "./createInMemoryOrderStack.js";
import { createInMemoryPaymentStack } from "../payment/createInMemoryPaymentStack.js";
import type { FakePaymentMode } from "../payment/domain/PaymentGateway.js";
import { PayCheckoutApplicationService } from "./application/PayCheckoutApplicationService.js";
import type { CheckoutHttpDeps } from "./http/checkoutHandlers.js";
import type { PaymentWebhookHttpDeps } from "../payment/api/webhookHandlers.js";

/**
 * Composition root — Identity + Marketplace + Order + Payment (Sprint 5.5).
 */
export function createInMemoryCheckoutApiStack(opts?: {
  jwtSecret?: string;
  paymentMode?: FakePaymentMode;
}) {
  const identity = createInMemoryIdentityStack(opts);
  const marketplace = createInMemoryMarketplaceStack();
  const order = createInMemoryOrderStack();
  const payment = createInMemoryPaymentStack({ mode: opts?.paymentMode ?? "async" });

  const onboardSeller = new OnboardSellerApplicationService(
    marketplace.tx,
    identity.tx,
    marketplace.sellers,
    identity.profiles,
    identity.roles,
  );

  const payCheckout = new PayCheckoutApplicationService(
    order.tx,
    order.checkouts,
    order.orders,
    marketplace.queries,
    marketplace.inventory,
    marketplace.tx,
    order.holdReservation,
    order.releaseReservation,
    payment.requestPayment,
  );

  const checkout: CheckoutHttpDeps = {
    auth: identity.auth,
    orderTx: order.tx,
    carts: order.carts,
    orders: order.orders,
    queries: marketplace.queries,
    createCart: order.createCart,
    addCartItem: order.addCartItem,
    removeCartItem: order.removeCartItem,
    startCheckout: order.startCheckout,
    payCheckout,
  };

  const paymentWebhook: PaymentWebhookHttpDeps = {
    applyWebhook: payment.applyPaymentWebhook,
    settlePayment: order.settlePayment,
  };

  const deps: AuthenticatedApiDeps = {
    registerUser: identity.registerUser,
    login: identity.login,
    refresh: identity.refresh,
    logout: identity.logout,
    onboardSeller,
    auth: identity.auth,
    identityTx: identity.tx,
    profiles: identity.profiles,
    queries: marketplace.queries,
    publishListing: marketplace.publishListing,
    adjustInventory: marketplace.adjustInventory,
    checkout,
    paymentWebhook,
  };

  return {
    identity,
    marketplace,
    order,
    payment,
    payCheckout,
    onboardSeller,
    deps,
    createServer: () => createAuthenticatedApiServer(deps),
    listen: (port?: number) => listenAuthenticatedApi(deps, port),
  };
}

export type InMemoryCheckoutApiStack = ReturnType<typeof createInMemoryCheckoutApiStack>;
