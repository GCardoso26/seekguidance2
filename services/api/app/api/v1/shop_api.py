"""API REST do marketplace de produtos físicos."""

from __future__ import annotations

from typing import Any

from app.api.deps import DbSession, SettingsDep
from app.api.v1.tournament_system import _require_user
from app.marketplace import shop_cart, shop_connect, shop_coupons, shop_orders, shop_pix, shop_products, shop_reviews
from app.marketplace import card_listings as card_listings_svc
from app.marketplace import shop_checkout as shop_checkout_svc
from app.stores import store as store_svc
from fastapi import APIRouter, Header, HTTPException, Request
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


class CartUpdateBody(BaseModel):
    quantity: int = Field(ge=0)


class CheckoutBody(BaseModel):
    shipping_address: dict[str, Any] | None = None
    coupon_code: str | None = None
    store_id: str | None = None


class OrderStatusBody(BaseModel):
    status: str
    tracking_code: str | None = None


class SubscribeCheckoutBody(BaseModel):
    plan: str = Field(default="pro", pattern="^(pro|enterprise)$")
    payment_method: str = Field(default="card", pattern="^(card|pix)$")
    success_url: str | None = None
    cancel_url: str | None = None


class ReviewCreateBody(BaseModel):
    order_id: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = None
    photos: list[str] | None = None


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
    return await shop_pix.create_pix_checkout(
        session,
        user_id,
        shipping_address=body.shipping_address,
        coupon_code=body.coupon_code,
        store_id=body.store_id,
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
            json_body = json.loads(raw.decode())
        except json.JSONDecodeError as exc:
            raise HTTPException(400, "Payload inválido") from exc

        if isinstance(json_body, dict) and json_body.get("txid") and not headers.get("x-openpix-signature"):
            return await shop_pix.confirm_pix_payment(
                session, str(json_body["txid"]), webhook_payload=json_body
            )

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
    order = await shop_orders.get_buyer_order(session, order_id, user_id)
    review = await shop_reviews.get_review_by_order(session, order_id, user_id)
    return {"order": order, "review": review}


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
