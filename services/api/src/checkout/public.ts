/** Public surface — Checkout BC V2 (ADR-011 / ADR-015). */
export {
  CheckoutService,
  createCheckoutService,
  type AddToCartCommand,
  type UpdateCartQuantityCommand,
  type MergeGuestCartCommand,
  type MergeUserCartCommand,
  type StartCheckoutCommand,
  type StartCheckoutV2Result,
  type ConfirmPaymentCommand,
  type ConfirmPaymentResult,
} from "./application/CheckoutService.js";
export {
  buildStartCheckoutSagaDefinition,
  type CheckoutSagaContext,
} from "./application/CheckoutSaga.js";
export {
  buildConfirmPaymentSagaDefinition,
  type ConfirmPaymentSagaContext,
} from "./application/ConfirmPaymentSaga.js";
export { CartAggregate } from "./domain/CartAggregate.js";
export {
  CouponEngine,
  createCouponEngine,
  applyCouponDiscount,
  type CouponDefinition,
  type CouponRule,
} from "./domain/CouponEngine.js";
export {
  createCheckoutValidationPipeline,
  CheckoutValidationPipeline,
  type CheckoutValidator,
} from "./application/CheckoutValidationPipeline.js";
export type { PaymentGateway, PaymentIntentResult } from "./application/payment/PaymentGateway.js";
export { createPaymentGateway } from "./application/payment/createPaymentGateway.js";
export type {
  Cart,
  CartItem,
  CheckoutSession,
  Coupon,
} from "./domain/types.js";
export { cartSubtotalCents } from "./domain/types.js";
