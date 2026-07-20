/** Public surface — Orders BC (ADR-011 / ADR-015). */
export {
  OrdersService,
  createOrdersService,
  type CreateOrderFromCheckoutResult,
} from "./application/OrdersService.js";
export { OrderAggregate } from "./domain/OrderAggregate.js";
export type { Order, OrderItem, OrderStatus, OrderPaymentStatus } from "./domain/types.js";
export {
  createOrdersProjectionConsumers,
  SellerOrdersProjection,
  BuyerOrdersProjection,
  DashboardProjection,
  RecentOrdersProjection,
} from "./projections/OrdersProjections.js";
export { CreateOrderFromCheckoutProjection } from "./projections/CreateOrderFromCheckoutProjection.js";
