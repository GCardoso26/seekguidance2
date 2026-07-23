"""API REST do marketplace de produtos físicos."""

from __future__ import annotations

from typing import Any, Literal

from app.api.deps import DbSession, SettingsDep
from app.api.v1.tournament_system import _require_user
from app.catalog.cron_auth import require_catalog_cron_auth
from app.marketplace import card_listings as card_listings_svc
from app.marketplace import (
    shop_buylist,
    shop_cart,
    shop_connect,
    shop_coupons,
    shop_crm,
    shop_escrow,
    shop_inventory,
    shop_orders,
    shop_pdv,
    shop_pix,
    shop_products,
    shop_reviews,
)
from app.marketplace import shop_checkout as shop_checkout_svc
from app.pdv import local_products as pdv_local_products
from app.stores import store as store_svc
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import PlainTextResponse
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
    card_id: str | None = None


class CartUpdateBody(BaseModel):
    quantity: int = Field(ge=0)


class CheckoutBody(BaseModel):
    shipping_address: dict[str, Any] | None = None
    coupon_code: str | None = None
    store_id: str | None = None
    checkout_session_id: str | None = None
    use_escrow: bool = False


class EscrowDisputeBody(BaseModel):
    reason: str = Field(min_length=10, max_length=2000)
    evidence: dict[str, Any] | None = None


class OrderStatusBody(BaseModel):
    status: str
    tracking_code: str | None = None


class SubscribeCheckoutBody(BaseModel):
    plan: str = Field(default="lojista", pattern="^(lojista|pro|enterprise)$")
    payment_method: str = Field(default="card", pattern="^(card|pix)$")
    success_url: str | None = None
    cancel_url: str | None = None


class ReviewCreateBody(BaseModel):
    order_id: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = None
    photos: list[str] | None = None
    recommend: bool | None = None
    item_as_described: bool | None = None
    shipping_speed: int | None = Field(default=None, ge=1, le=5)
    communication: int | None = Field(default=None, ge=1, le=5)


class ReviewEditBody(BaseModel):
    comment: str | None = None
    photos: list[str] | None = None


class ReviewRespondBody(BaseModel):
    response: str = Field(min_length=1, max_length=2000)


class CouponCreateBody(BaseModel):
    code: str = Field(min_length=3, max_length=50)
    type: str = Field(pattern="^(percentage|fixed)$")
    value_cents: int = Field(gt=0)
    min_order_cents: int = Field(default=0, ge=0)
    max_discount_cents: int | None = Field(default=None, gt=0)
    max_uses: int | None = Field(default=None, gt=0)


class CouponValidateBody(BaseModel):
    store_id: str
    code: str
    order_total_cents: int = Field(gt=0)


class ReviewFlagBody(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


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


class ListingCreateBody(BaseModel):
    card_id: str
    condition: str = Field(pattern="^(NM|LP|MP|HP|DM)$")
    price: float = Field(gt=0)
    quantity: int = Field(default=1, ge=1)
    foil: bool = False
    language: str = "pt"
    description: str | None = None


class ListingUpdateBody(BaseModel):
    price: float | None = Field(default=None, gt=0)
    quantity: int | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, pattern="^(active|sold|reserved|inactive)$")
    description: str | None = None


class StoreSubscribeBody(BaseModel):
    plan: str = Field(default="lojista", pattern="^(lojista|pro|enterprise)$")


class BuylistItemBody(BaseModel):
    card_id: str | None = None
    card_name: str = Field(min_length=1, max_length=200)
    set_code: str | None = None
    quantity: int = Field(default=1, ge=1)
    condition: str | None = "near_mint"
    offer_cents: int | None = Field(default=None, ge=0)


class BuylistCreateBody(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    discount_pct: float = Field(default=0.30, ge=0, le=0.9)
    notes: str | None = None
    items: list[BuylistItemBody] = Field(min_length=1)


class BuylistSubmitBody(BaseModel):
    message: str | None = None


class BuylistSubmissionStatusBody(BaseModel):
    status: str = Field(pattern="^(accepted|rejected|completed|cancelled)$")


class PdvItemBody(BaseModel):
    product_id: str | None = None
    local_product_id: str | None = None
    source: str | None = Field(default=None, pattern="^(official|local)$")
    name: str | None = None
    quantity: int = Field(default=1, ge=1)
    price_cents: int = Field(ge=0)


class PdvSaleBody(BaseModel):
    items: list[PdvItemBody] = Field(min_length=1)
    payment_method: str = Field(default="cash", pattern="^(cash|pix|card)$")
    notes: str | None = None


class PdvPixBody(BaseModel):
    items: list[PdvItemBody] = Field(min_length=1)


class PdvSalePatchBody(BaseModel):
    status: str = Field(default="paid", pattern="^paid$")


class PdvLocalProductBody(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: str
    price_cents: int = Field(ge=0)
    cost_cents: int | None = Field(default=None, ge=0)
    sku: str | None = None
    barcode: str | None = None
    stock: int | None = Field(default=None, ge=0)
    minimum_stock: int | None = Field(default=None, ge=0)
    active: bool = True
    item_kind: str = Field(default="goods", pattern="^(goods|consumable|service|fee)$")


class PdvLocalProductUpdateBody(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = None
    price_cents: int | None = Field(default=None, ge=0)
    cost_cents: int | None = Field(default=None, ge=0)
    sku: str | None = None
    barcode: str | None = None
    stock: int | None = Field(default=None, ge=0)
    minimum_stock: int | None = Field(default=None, ge=0)
    active: bool | None = None
    item_kind: str | None = Field(default=None, pattern="^(goods|consumable|service|fee)$")


class CrmNotesBody(BaseModel):
    notes: str = Field(max_length=5000)


class InventoryImportBody(BaseModel):
    csv: str = Field(min_length=1)
    dry_run: bool = False
    on_duplicate: Literal["ask", "merge", "skip"] = "ask"


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
    condition: str | None = None,
    in_stock: bool | None = None,
    sort: str = "created_at",
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    min_cents = int(min_price * 100) if min_price is not None else None
    max_cents = int(max_price * 100) if max_price is not None else None
    conditions = [c.strip() for c in (condition or "").split(",") if c.strip()] or None
    return await shop_products.list_products(
        session,
        tcg_id=tcg_id,
        category=category,
        store_id=store_id,
        store_slug=store_slug,
        search=search,
        min_price_cents=min_cents,
        max_price_cents=max_cents,
        conditions=conditions,
        in_stock=in_stock,
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
    cart = await shop_cart.add_to_cart(
        session,
        user_id,
        body.product_id,
        body.quantity,
        expected_card_id=body.card_id,
    )
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
        session,
        user_id,
        shipping_address=body.shipping_address,
        checkout_session_id=body.checkout_session_id,
        use_escrow=body.use_escrow,
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
    return await shop_pix.create_pix_checkout(
        session,
        user_id,
        shipping_address=body.shipping_address,
        coupon_code=body.coupon_code,
        store_id=body.store_id,
        checkout_session_id=body.checkout_session_id,
        use_escrow=body.use_escrow,
    )


@router.post("/runtime/judge/marketplace/shop/pix/webhook")
async def pix_webhook(
    request: Request,
    session: DbSession,
    settings: SettingsDep,
) -> dict[str, Any]:
    raw = await request.body()
    headers = {k.lower(): v for k, v in request.headers.items()}

    if raw.strip().startswith(b"{") or raw.strip().startswith(b"["):
        import json

        try:
            json.loads(raw.decode())
        except json.JSONDecodeError as exc:
            raise HTTPException(400, "Payload inválido") from exc

    return await shop_pix.handle_pix_gateway_webhook(session, settings, raw, headers)


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/pix-webhook-status")
async def pix_webhook_status(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_pix.get_pix_webhook_status(session, store_id, user_id)


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


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/subscribe/checkout")
async def subscribe_pro_checkout(
    session: DbSession,
    settings: SettingsDep,
    store_id: str,
    body: SubscribeCheckoutBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.stores.subscriptions import create_subscription_checkout

    user_id = _require_user(x_judge_user_id)
    return await create_subscription_checkout(
        session,
        settings,
        store_id,
        user_id,
        body.plan,
        payment_method=body.payment_method,
        success_url=body.success_url,
        cancel_url=body.cancel_url,
    )


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/subscribe/cancel")
async def cancel_pro_subscription(
    session: DbSession,
    settings: SettingsDep,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.stores.subscriptions import cancel_subscription

    user_id = _require_user(x_judge_user_id)
    return await cancel_subscription(session, store_id, user_id, settings)


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/subscription")
async def get_store_subscription(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.stores.subscriptions import get_subscription_status

    user_id = _require_user(x_judge_user_id)
    return await get_subscription_status(session, store_id, user_id)


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
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    page: int = 1,
    limit: int = 50,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_orders.list_store_orders(
        session,
        store_id,
        user_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit,
    )


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/orders/export")
async def export_store_orders(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> PlainTextResponse:
    user_id = _require_user(x_judge_user_id)
    csv_data = await shop_orders.export_store_orders_csv(session, store_id, user_id)
    return PlainTextResponse(csv_data, media_type="text/csv")


@router.put("/runtime/judge/marketplace/shop/orders/{order_id}/status")
async def patch_order_status(
    session: DbSession,
    order_id: str,
    body: OrderStatusBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    order = await shop_orders.update_order_status(
        session, order_id, user_id, body.status, tracking_code=body.tracking_code
    )
    return {"order": order}


@router.post("/runtime/judge/marketplace/shop/reviews")
async def create_shop_review(
    session: DbSession,
    body: ReviewCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    review = await shop_reviews.create_shop_review(
        session,
        body.order_id,
        user_id,
        rating=body.rating,
        comment=body.comment,
        photos=body.photos,
        recommend=body.recommend,
        item_as_described=body.item_as_described,
        shipping_speed=body.shipping_speed,
        communication=body.communication,
    )
    return {"review": review}


@router.patch("/runtime/judge/marketplace/shop/reviews/{review_id}")
async def edit_shop_review(
    session: DbSession,
    review_id: str,
    body: ReviewEditBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    review = await shop_reviews.update_shop_review(
        session,
        review_id,
        user_id,
        comment=body.comment,
        photos=body.photos,
    )
    return {"review": review}


@router.get("/runtime/judge/marketplace/shop/orders/{order_id}")
async def get_order(
    session: DbSession,
    order_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    order = await shop_orders.get_buyer_order_with_escrow(session, order_id, user_id)
    review = await shop_reviews.get_review_by_order(session, order_id, user_id)
    return {"order": order, "review": review}


@router.post("/runtime/judge/marketplace/shop/escrow/{escrow_id}/confirm")
async def confirm_escrow_delivery(
    session: DbSession,
    escrow_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    escrow = await shop_escrow.confirm_delivery(session, escrow_id, user_id)
    return {"escrow": escrow}


@router.post("/runtime/judge/marketplace/shop/escrow/{escrow_id}/dispute")
async def dispute_escrow(
    session: DbSession,
    escrow_id: str,
    body: EscrowDisputeBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    escrow = await shop_escrow.open_dispute(
        session, escrow_id, user_id, reason=body.reason, evidence=body.evidence
    )
    return {"escrow": escrow}


@router.post("/runtime/judge/marketplace/shop/escrow/cron/auto-actions")
async def escrow_cron_auto_actions(
    session: DbSession,
    _: None = Depends(require_catalog_cron_auth),
) -> dict[str, Any]:
    return await shop_escrow.run_auto_actions(session)


@router.get("/runtime/judge/marketplace/shop/pix/status/{txid}")
async def pix_status(session: DbSession, txid: str) -> dict[str, Any]:
    return await shop_pix.get_pix_status(session, txid)


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/reviews")
async def list_shop_reviews(
    session: DbSession,
    store_id: str,
    page: int = 1,
    limit: int = 10,
    filter: str = "recent",
) -> dict[str, Any]:
    return await shop_reviews.list_store_reviews(
        session, store_id, page=page, limit=limit, filter_type=filter
    )


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/reviews/stats")
async def shop_review_stats(session: DbSession, store_id: str) -> dict[str, Any]:
    return await shop_reviews.get_store_review_stats(session, store_id)


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/reviews/manage")
async def manage_shop_reviews(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    reviews = await shop_reviews.list_owner_reviews(session, store_id, user_id)
    stats = await shop_reviews.get_store_review_stats(session, store_id)
    return {"reviews": reviews, "stats": stats}


@router.post("/runtime/judge/marketplace/shop/reviews/{review_id}/flag")
async def flag_shop_review(
    session: DbSession,
    review_id: str,
    body: ReviewFlagBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    review = await shop_reviews.flag_review(session, review_id, user_id, body.reason)
    return {"review": review}


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/coupons/{coupon_id}/deactivate")
async def deactivate_store_coupon(
    session: DbSession,
    store_id: str,
    coupon_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    coupon = await shop_coupons.deactivate_coupon(session, store_id, user_id, coupon_id)
    return {"coupon": coupon}


@router.post("/runtime/judge/marketplace/shop/reviews/{review_id}/respond")
async def respond_shop_review(
    session: DbSession,
    review_id: str,
    body: ReviewRespondBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    review = await shop_reviews.respond_to_review(session, review_id, user_id, body.response)
    return {"review": review}


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/coupons")
async def create_store_coupon(
    session: DbSession,
    store_id: str,
    body: CouponCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    coupon = await shop_coupons.create_coupon(
        session,
        store_id,
        user_id,
        code=body.code,
        coupon_type=body.type,
        value_cents=body.value_cents,
        min_order_cents=body.min_order_cents,
        max_discount_cents=body.max_discount_cents,
        max_uses=body.max_uses,
    )
    return {"coupon": coupon}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/coupons")
async def list_store_coupons(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    coupons = await shop_coupons.list_coupons(session, store_id, user_id)
    return {"coupons": coupons}


@router.post("/runtime/judge/marketplace/shop/coupons/validate")
async def validate_shop_coupon(session: DbSession, body: CouponValidateBody) -> dict[str, Any]:
    return await shop_coupons.validate_coupon(
        session, body.store_id, body.code, body.order_total_cents
    )


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/dashboard")
async def store_dashboard(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_orders.store_dashboard_enhanced(session, store_id, user_id)


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


@router.post("/runtime/judge/marketplace/listings")
async def create_card_listing(
    session: DbSession,
    body: ListingCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    listing = await card_listings_svc.create_listing(
        session,
        user_id,
        card_id=body.card_id,
        condition=body.condition,
        price_cents=int(round(body.price * 100)),
        quantity=body.quantity,
        foil=body.foil,
        language=body.language,
        description=body.description,
    )
    return {"listing": listing}


@router.get("/runtime/judge/marketplace/listings/by-card/{card_id}")
async def listings_by_card(
    session: DbSession,
    card_id: str,
    condition: str | None = None,
    foil: bool | None = None,
) -> dict[str, Any]:
    listings = await card_listings_svc.list_listings_by_card(
        session, card_id, condition=condition, foil=foil
    )
    return {"listings": listings}


@router.get("/runtime/judge/marketplace/listings/my")
async def my_listings(
    session: DbSession,
    status: str | None = None,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    listings = await card_listings_svc.list_my_listings(session, user_id, status=status)
    return {"listings": listings}


@router.patch("/runtime/judge/marketplace/listings/{listing_id}")
async def patch_listing(
    session: DbSession,
    listing_id: str,
    body: ListingUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    fields: dict[str, Any] = {}
    if body.price is not None:
        fields["price_cents"] = int(round(body.price * 100))
    if body.quantity is not None:
        fields["quantity"] = body.quantity
    if body.status is not None:
        fields["status"] = body.status
    if body.description is not None:
        fields["description"] = body.description
    listing = await card_listings_svc.update_listing(session, listing_id, user_id, fields)
    return {"listing": listing}


@router.delete("/runtime/judge/marketplace/listings/{listing_id}")
async def remove_listing(
    session: DbSession,
    listing_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await card_listings_svc.delete_listing(session, listing_id, user_id)


# --- Sprint 4: BuyList, CRM, Estoque, PDV ---


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/buylists")
async def create_store_buylist(
    session: DbSession,
    store_id: str,
    body: BuylistCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    buylist = await shop_buylist.create_buylist(
        session,
        store_id,
        user_id,
        title=body.title,
        discount_pct=body.discount_pct,
        notes=body.notes,
        items=[i.model_dump() for i in body.items],
    )
    return {"buylist": buylist}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/buylists")
async def list_store_buylists(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    buylists = await shop_buylist.list_store_buylists(session, store_id, user_id)
    return {"buylists": buylists}


@router.get("/runtime/judge/marketplace/shop/buylists/public/{token}")
async def get_public_buylist(session: DbSession, token: str) -> dict[str, Any]:
    buylist = await shop_buylist.get_buylist_by_token(session, token)
    return {"buylist": buylist}


@router.post("/runtime/judge/marketplace/shop/buylists/public/{token}/submit")
async def submit_public_buylist(
    session: DbSession,
    token: str,
    body: BuylistSubmitBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    submission = await shop_buylist.submit_buylist(session, token, user_id, message=body.message)
    return {"submission": submission}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/buylists/submissions")
async def list_buylist_submissions(
    session: DbSession,
    store_id: str,
    status: str | None = None,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    submissions = await shop_buylist.list_submissions(session, store_id, user_id, status=status)
    return {"submissions": submissions}


@router.patch("/runtime/judge/marketplace/shop/stores/{store_id}/buylists/submissions/{submission_id}")
async def patch_buylist_submission(
    session: DbSession,
    store_id: str,
    submission_id: str,
    body: BuylistSubmissionStatusBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    submission = await shop_buylist.update_submission_status(
        session, submission_id, store_id, user_id, body.status
    )
    return {"submission": submission}


@router.post(
    "/runtime/judge/marketplace/shop/stores/{store_id}/buylists/submissions/{submission_id}/pay-pix"
)
async def buylist_submission_pay_pix(
    session: DbSession,
    store_id: str,
    submission_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    pix = await shop_buylist.create_buylist_pix_payment(
        session, submission_id, store_id, user_id
    )
    return {"pix": pix}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/inventory")
async def store_inventory(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_inventory.inventory_summary(session, store_id, user_id)


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/inventory/import-csv")
async def store_inventory_import_csv(
    session: DbSession,
    store_id: str,
    body: InventoryImportBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    result = await shop_inventory.import_products_csv(
        session,
        store_id,
        user_id,
        body.csv,
        dry_run=body.dry_run,
        on_duplicate=body.on_duplicate,
    )
    return result


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/crm/customers")
async def list_crm_customers(
    session: DbSession,
    store_id: str,
    segment: str | None = None,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    customers = await shop_crm.list_customers(session, store_id, user_id, segment=segment)
    return {"customers": customers}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/crm/summary")
async def crm_summary(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    summary = await shop_crm.crm_summary(session, store_id, user_id)
    return {"summary": summary}


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/crm/sync")
async def sync_crm_customers(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    count = await shop_crm.sync_customers_from_orders(session, store_id, user_id)
    return {"synced": count}


@router.patch("/runtime/judge/marketplace/shop/stores/{store_id}/crm/customers/{customer_id}")
async def patch_crm_customer(
    session: DbSession,
    store_id: str,
    customer_id: str,
    body: CrmNotesBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    customer = await shop_crm.update_customer_notes(session, store_id, user_id, customer_id, body.notes)
    return {"customer": customer}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/products")
async def search_pdv_products(
    session: DbSession,
    store_id: str,
    q: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    products = await shop_pdv.search_pdv_products(session, store_id, user_id, q)
    return {"products": products}


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/sales")
async def create_pdv_sale(
    session: DbSession,
    store_id: str,
    body: PdvSaleBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    sale = await shop_pdv.create_pdv_sale(
        session,
        store_id,
        user_id,
        items=[i.model_dump() for i in body.items],
        payment_method=body.payment_method,
        notes=body.notes,
    )
    return {"sale": sale}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/sales")
async def list_pdv_sales(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    sales = await shop_pdv.list_pdv_sales(session, store_id, user_id)
    return {"sales": sales}


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/pix")
async def create_pdv_pix(
    session: DbSession,
    store_id: str,
    body: PdvPixBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_pdv.create_pdv_pix_charge(
        session,
        store_id,
        user_id,
        items=[i.model_dump() for i in body.items],
    )


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/pix/{transaction_id}/status")
async def get_pdv_pix_status(
    session: DbSession,
    store_id: str,
    transaction_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_pdv.get_pdv_pix_status(session, store_id, user_id, transaction_id)


@router.patch("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/sales/{sale_id}")
async def patch_pdv_sale(
    session: DbSession,
    store_id: str,
    sale_id: str,
    body: PdvSalePatchBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await shop_pdv.patch_pdv_sale(session, store_id, user_id, sale_id, status=body.status)


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/local-products")
async def list_pdv_local_products(
    session: DbSession,
    store_id: str,
    category: str | None = None,
    active: bool | None = None,
    low_stock: bool = False,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    products = await pdv_local_products.list_local_products(
        session,
        store_id,
        user_id,
        category=category,
        active=active,
        low_stock=low_stock,
    )
    return {"products": products}


@router.post("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/local-products")
async def create_pdv_local_product(
    session: DbSession,
    store_id: str,
    body: PdvLocalProductBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    product = await pdv_local_products.create_local_product(
        session, store_id, user_id, body.model_dump()
    )
    return {"product": product}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/local-products/search")
async def search_pdv_local_products(
    session: DbSession,
    store_id: str,
    q: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    products = await pdv_local_products.search_local_products(session, store_id, user_id, q)
    return {"products": products}


@router.get("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/local-products/reports")
async def reports_pdv_local_products(
    session: DbSession,
    store_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    report = await pdv_local_products.reports_local_products(session, store_id, user_id)
    return {"report": report}


@router.put("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/local-products/{product_id}")
async def update_pdv_local_product(
    session: DbSession,
    store_id: str,
    product_id: str,
    body: PdvLocalProductUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    product = await pdv_local_products.update_local_product(
        session,
        store_id,
        user_id,
        product_id,
        body.model_dump(exclude_unset=True),
    )
    return {"product": product}


@router.delete("/runtime/judge/marketplace/shop/stores/{store_id}/pdv/local-products/{product_id}")
async def delete_pdv_local_product(
    session: DbSession,
    store_id: str,
    product_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    product = await pdv_local_products.delete_local_product(
        session, store_id, user_id, product_id
    )
    return {"product": product}
