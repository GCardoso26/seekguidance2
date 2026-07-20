/** Public surface — Checkout BC V2 (ADR-011 / ADR-015). */
export {
  CheckoutService,
  createCheckoutService,
  type AddToCartCommand,
  type StartCheckoutCommand,
  type StartCheckoutV2Result,
} from "./application/CheckoutService.js";
export {
  buildStartCheckoutSagaDefinition,
  type CheckoutSagaContext,
} from "./application/CheckoutSaga.js";
export type {
  Cart,
  CartItem,
  CheckoutSession,
  Coupon,
} from "./domain/types.js";
export { applyCouponDiscount, cartSubtotalCents } from "./domain/types.js";
