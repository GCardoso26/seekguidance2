"""API REST do marketplace de produtos físicos."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.marketplace import shop_cart, shop_connect, shop_orders, shop_pix, shop_products
from app.marketplace import shop_checkout as shop_checkout_svc
from app.stores import store as store_svc
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(tags=["marketplace-shop"])


class ProductCreateBody(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None
    tcg_id: str | None = None
    category: str
    price_cents: int = Field(gt=0)
    compare_at_price_cents: int | None = Field(default=None, gt=0)
    stock: int = Field(default=0, ge=0)
    sku: str | None = None
    images: list[str] | None = None


class ProductUpdateBody(BaseModel):
    name: str | None = None
    description: str | None = None
    tcg_id: str | None = None
    category: str | None = None
    price_cents: int | None = Field(default=None, gt=0)
    compare_at_price_cents: int | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)
    sku: str | None = None
    images: list[str] | None = None
    is_active: bool | None = None


class CartAddBody(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1)


class CartUpdateBody(BaseModel):
    quantity: int = Field(ge=0)


class CheckoutBody(BaseModel):
    shipping_address: dict[str, Any] | None = None


class OrderStatusBody(BaseModel):
    status: str


class ConnectOnboardBody(BaseModel):
    store_id: str | None = None
    refresh_url: str | None = None
    return_url: str | None = None


class PaymentSettingsBody(BaseModel):
    pix_key_type: str | None = None
    pix_key: str | None = None
    payment_method_preference: str | None = None


class PixWebhookBody(BaseModel):
    txid: str = Field(min_length=4)


class StoreSubscribeBody(BaseModel):
    plan: str = Field(default="pro", pattern="^(pro|enterprise)$")


@router.get("/runtime/judge/marketplace/shop/products")
async def list_shop_products(
    session: DbSession,
    tcg_id: str | None = None,
    category: str | None = None,
    store_id: str | None = None,
    store_slug: str | None = None,
    search: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    sort: str = "created_at",
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    min_cents = int(min_price * 100) if min_price is not None else None
    max_cents = int(max_price * 100) if max_price is not None else None
    return await shop_products.list_products(
        session,
        tcg_id=tcg_id,
        category=category,
        store_id=store_id,
        store_slug=store_slug,
        search=search,
        min_price_cents=min_cents,
        max_price_cents=max_cents,
        sort=sort,
        page=max(1, page),
        limit=min(50, max(1, limit)),
    )


@router.get("/runtime/judge/marketplace/shop/products/{product_id}")
async def get_shop_product(session: DbSession, product_id: str) -> dict[str, Any]:
    product = await shop_products.get_product(session, product_id)
    if not product:
        raise HTTPException(404, "Produto não encontrado")
    return {"product": product}


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/products")
async def create_shop_product(
    session: DbSession,
    store_id: str,
    body: ProductCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    product = await shop_products.create_product(
        session, store_id, user_id, **body.model_dump()
    )
    return {"product": product}


@router.put("/runtime/judge/marketplace/shop/products/{product_id}")
async def update_shop_product(
    session: DbSession,
    product_id: str,
    body: ProductUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    product = await shop_products.update_product(
        session, product_id, user_id, body.model_dump(exclude_none=True)
    )
    return {"product": product}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/products/manage")
async def manage_store_products(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    products = await shop_products.list_store_products(session, store_id, user_id)
    return {"products": products}


@router.get("/runtime/judge/marketplace/shop/stores/slug/{slug}")
async def get_shop_store(session: DbSession, slug: str) -> dict[str, Any]:
    from app.marketplace.shop_store import store_is_sellable

    store = await store_svc.get_store_by_slug(session, slug)
    if not store or not store_is_sellable(store):
        raise HTTPException(404, "Loja não encontrada")
    products = await shop_products.list_products(session, store_slug=slug, limit=48)
    return {"store": store, **products}


@router.get("/runtime/judge/marketplace/shop/cart")
async def get_cart(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    cart = await shop_cart.get_cart(session, user_id)
    return {"cart": cart}


@router.post("/runtime/judge/marketplace/shop/cart/items")
async def add_cart_item(
    session: DbSession,
    body: CartAddBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    cart = await shop_cart.add_to_cart(session, user_id, body.product_id, body.quantity)
    return {"cart": cart}


@router.put("/runtime/judge/marketplace/shop/cart/items/{product_id}")
async def update_cart_item(
    session: DbSession,
    product_id: str,
    body: CartUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    cart = await shop_cart.update_cart_item(session, user_id, product_id, body.quantity)
    return {"cart": cart}


@router.delete("/runtime/judge/marketplace/shop/cart/items/{product_id}")
async def delete_cart_item(
    session: DbSession,
    product_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    cart = await shop_cart.remove_from_cart(session, user_id, product_id)
    return {"cart": cart}


@router.post("/runtime/judge/marketplace/shop/checkout")
async def shop_checkout(
    session: DbSession,
    body: CheckoutBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_checkout_svc.create_checkout(
        session, user_id, shipping_address=body.shipping_address
    )


@router.get("/runtime/judge/marketplace/shop/checkout/methods")
async def checkout_methods(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_pix.get_checkout_methods(session, user_id)


@router.post("/runtime/judge/marketplace/shop/checkout/pix")
async def checkout_pix(
    session: DbSession,
    body: CheckoutBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_pix.create_pix_checkout(session, user_id, shipping_address=body.shipping_address)


@router.post("/runtime/judge/marketplace/shop/pix/webhook")
async def pix_webhook(session: DbSession, body: PixWebhookBody) -> dict[str, Any]:
    return await shop_pix.confirm_pix_payment(session, body.txid)


@router.put("/runtime/judge/marketplace/shop/stores/{store_id}/payment-settings")
async def update_payment_settings(
    session: DbSession,
    store_id: str,
    body: PaymentSettingsBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    store = await shop_pix.update_payment_settings(
        session,
        store_id,
        user_id,
        pix_key_type=body.pix_key_type,
        pix_key=body.pix_key,
        payment_method_preference=body.payment_method_preference,
    )
    return {"store": store}


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/subscribe")
async def subscribe_pro_store(
    session: DbSession,
    store_id: str,
    body: StoreSubscribeBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.stores.subscriptions import subscribe_store

    user_id = _require_user(x_judge_user_id)
    store = await subscribe_store(session, store_id, user_id, body.plan)
    return {"store": store}


@router.get("/runtime/judge/marketplace/shop/orders")
async def my_orders(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    orders = await shop_orders.list_buyer_orders(session, user_id)
    return {"orders": orders}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/orders")
async def store_orders(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    orders = await shop_orders.list_store_orders(session, store_id, user_id)
    return {"orders": orders}


@router.put("/runtime/judge/marketplace/shop/orders/{order_id}/status")
async def patch_order_status(
    session: DbSession,
    order_id: str,
    body: OrderStatusBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    order = await shop_orders.update_order_status(session, order_id, user_id, body.status)
    return {"order": order}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/dashboard")
async def store_dashboard(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_orders.store_dashboard_stats(session, store_id, user_id)


@router.post("/runtime/judge/marketplace/shop/connect/onboard")
async def connect_onboard(
    session: DbSession,
    body: ConnectOnboardBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_connect.start_connect_onboarding(
        session,
        user_id,
        store_id=body.store_id,
        refresh_url=body.refresh_url,
        return_url=body.return_url,
    )


@router.post("/runtime/judge/marketplace/shop/connect/refresh/{store_id}")
async def connect_refresh(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_connect.refresh_connect_status(session, store_id, user_id)
