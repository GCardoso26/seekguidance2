"""Painel do vendedor — rotas consolidadas sobre shop/listings existentes."""

from __future__ import annotations

from typing import Any, Literal

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.marketplace import card_listings as card_listings_svc
from app.marketplace import seller_catalog as seller_cat
from app.marketplace import seller_customers as seller_cust
from app.marketplace import seller_dashboard as seller_dash
from app.marketplace import seller_finance as seller_fin
from app.marketplace import seller_fulfillment as seller_ff
from app.marketplace import seller_header_notifications as seller_hdr_notif
from app.marketplace import seller_inventory_analytics as seller_inv_analytics
from app.marketplace import seller_inventory_bulk as seller_inv_bulk
from app.marketplace import seller_inventory_dashboard as seller_inv_dash
from app.marketplace import seller_inventory_export as seller_inv_export
from app.marketplace import seller_inventory_search as seller_inv
from app.marketplace import seller_search as seller_search_svc
from app.marketplace import seller_team as seller_team_svc
from app.marketplace import seller_tickets as seller_tix
from app.marketplace import shop_inventory as shop_inv
from app.marketplace import shop_orders
from app.marketplace import shop_products as shop_products_svc
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(tags=["seller-dashboard"])


class ShippingBody(BaseModel):
    tracking_code: str = Field(min_length=1, max_length=120)
    carrier: str | None = None


class FulfillmentCommandBody(BaseModel):
    command: str = Field(min_length=1, max_length=64)
    carrier: str | None = None
    tracking_code: str | None = None


class BulkFulfillmentCommandBody(BaseModel):
    order_ids: list[str] = Field(min_length=1, max_length=50)
    command: str = Field(min_length=1, max_length=64)
    carrier: str | None = None


class SellerSettingsBody(BaseModel):
    name: str | None = None
    description: str | None = None


class ListingUpdateBody(BaseModel):
    price: float | None = None
    quantity: int | None = None
    status: str | None = None
    description: str | None = None


class ListingCreateBody(BaseModel):
    card_id: str
    condition: str = "NM"
    price: float = Field(gt=0)
    quantity: int = Field(ge=1, default=1)
    foil: bool = False
    language: str = "pt"
    description: str | None = None


class ProductCreateBody(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    category: str
    price: float = Field(gt=0)
    quantity: int = Field(ge=0, default=0)
    sku: str | None = None
    tcg_id: str | None = None


class ProductUpdateBody(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    price: float | None = None
    quantity: int | None = None
    sku: str | None = None
    is_active: bool | None = None


class TicketCreateBody(BaseModel):
    subject: str = Field(min_length=1, max_length=500)
    category: str = "other"
    priority: str = "medium"
    customer_id: str | None = None
    order_id: str | None = None
    message: str | None = None


class TicketMessageBody(BaseModel):
    content: str = Field(min_length=1)
    is_internal: bool = False


class TicketStatusBody(BaseModel):
    status: str


class TicketAssignBody(BaseModel):
    assignee_id: str


class TeamInviteBody(BaseModel):
    email: str = Field(min_length=3)
    role: str = "operator"
    display_name: str | None = None


class TeamRoleBody(BaseModel):
    role: str


class TeamPermissionsBody(BaseModel):
    permissions: dict[str, Any]


class NotificationSettingsBody(BaseModel):
    settings: dict[str, Any]


class InventoryAdjustBody(BaseModel):
    kind: Literal["cards", "products"] = "cards"
    mode: Literal["set", "add"] = "set"
    quantity: int = Field(ge=0, default=0)
    listing_id: str | None = None
    product_id: str | None = None
    card_id: str | None = None
    price_cents: int | None = Field(default=None, ge=0)
    condition: str | None = None
    language: str | None = None
    foil: bool = False
    title: str | None = None
    category: str | None = None


class InventoryBulkBody(BaseModel):
    action: Literal["adjust_set", "adjust_add", "publish", "archive", "delete"]
    items: list[dict[str, Any]] = Field(default_factory=list)
    quantity: int | None = None


class InventoryExportBody(BaseModel):
    format: Literal["csv", "json"] = "csv"
    source: Literal["my_catalog", "system", "bestsellers_marketplace", "bestsellers_store"] = "my_catalog"
    kind: Literal["cards", "products"] = "products"
    game: str = "mtg"
    q: str | None = None
    ids: list[str] | None = None


class InventoryImportBody(BaseModel):
    csv: str = Field(min_length=1)
    dry_run: bool = False


@router.get("/runtime/judge/seller/dashboard")
async def seller_dashboard_get(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_dash.get_dashboard(session, user_id)


@router.get("/runtime/judge/seller/dashboard/overview")
async def seller_dashboard_overview_get(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_dash.get_dashboard_overview(session, user_id)


@router.get("/runtime/judge/seller/listings")
async def seller_listings_list(
    session: DbSession,
    status: str | None = None,
    page: int = 1,
    limit: int = 24,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_dash.list_seller_listings(
        session, user_id, status=status, page=page, limit=limit
    )


@router.patch("/runtime/judge/seller/listings/{listing_id}")
async def seller_listing_patch(
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


@router.delete("/runtime/judge/seller/listings/{listing_id}")
async def seller_listing_delete(
    session: DbSession,
    listing_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    await card_listings_svc.delete_listing(session, listing_id, user_id)
    return {"ok": True}


@router.get("/runtime/judge/seller/orders")
async def seller_orders_list(
    session: DbSession,
    status: str | None = None,
    tab: str | None = None,
    search: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    min_value: float | None = None,
    max_value: float | None = None,
    payment_method: str | None = None,
    period: str | None = None,
    page: int = 1,
    limit: int = 20,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    store = await seller_dash.resolve_owner_store(session, user_id)
    min_cents = int(round(min_value * 100)) if min_value is not None else None
    max_cents = int(round(max_value * 100)) if max_value is not None else None
    return await shop_orders.list_store_orders(
        session,
        str(store["id"]),
        user_id,
        status=status,
        tab=tab,
        search=search,
        date_from=date_from or period,
        date_to=date_to,
        min_value_cents=min_cents,
        max_value_cents=max_cents,
        payment_method=payment_method,
        page=page,
        limit=limit,
    )


@router.get("/runtime/judge/seller/orders/{order_id}")
async def seller_order_detail(
    session: DbSession,
    order_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    order = await seller_dash.get_store_order(session, order_id, user_id)
    return {"order": order}


@router.post("/runtime/judge/seller/orders/{order_id}/ship")
async def seller_order_ship(
    session: DbSession,
    order_id: str,
    body: ShippingBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    result = await seller_ff.execute_fulfillment_command(
        session,
        order_id,
        user_id,
        "confirm_ship",
        carrier=body.carrier,
        tracking_code=body.tracking_code,
    )
    order = await seller_dash.get_store_order(session, order_id, user_id)
    return {"order": order, "fulfillment": result.get("fulfillment")}


@router.get("/runtime/judge/seller/orders/{order_id}/fulfillment")
async def seller_order_fulfillment_get(
    session: DbSession,
    order_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    projection = await seller_ff.get_fulfillment_projection(session, order_id, user_id)
    return {"fulfillment": projection}


@router.post("/runtime/judge/seller/orders/{order_id}/fulfillment/commands")
async def seller_order_fulfillment_command(
    session: DbSession,
    order_id: str,
    body: FulfillmentCommandBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_ff.execute_fulfillment_command(
        session,
        order_id,
        user_id,
        body.command,
        carrier=body.carrier,
        tracking_code=body.tracking_code,
    )


@router.post("/runtime/judge/seller/orders/bulk/fulfillment/commands")
async def seller_orders_bulk_fulfillment_command(
    session: DbSession,
    body: BulkFulfillmentCommandBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_ff.bulk_execute_fulfillment_commands(
        session,
        user_id,
        body.order_ids,
        body.command,
        carrier=body.carrier,
    )


@router.get("/runtime/judge/seller/stats")
async def seller_stats_get(
    session: DbSession,
    period: Literal["7d", "30d", "90d", "1y", "all"] = "30d",
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_dash.get_seller_stats(session, user_id, period=period)


@router.get("/runtime/judge/seller/settings")
async def seller_settings_get(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_dash.get_seller_settings(session, user_id)


@router.put("/runtime/judge/seller/settings")
async def seller_settings_put(
    session: DbSession,
    body: SellerSettingsBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_dash.update_seller_settings(
        session, user_id, name=body.name, description=body.description
    )


@router.post("/runtime/judge/seller/listings")
async def seller_listing_create(
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


@router.get("/runtime/judge/seller/catalog/cards")
async def seller_catalog_cards(
    session: DbSession,
    game: str = "mtg",
    q: str | None = None,
    page: int = 1,
    limit: int = 24,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_cat.search_catalog_cards(
        session, user_id, game=game, q=q, page=page, limit=limit
    )


@router.get("/runtime/judge/seller/catalog/expansions")
async def seller_catalog_expansions(
    session: DbSession,
    game: str = "mtg",
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    expansions = await seller_cat.list_expansions(session, user_id, game=game)
    return {"expansions": expansions}


@router.post("/runtime/judge/seller/catalog/expansions/{set_code}/import")
async def seller_catalog_expansion_import(
    session: DbSession,
    set_code: str,
    game: str | None = None,
    default_price: float = 1.0,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_cat.import_expansion_listings(
        session,
        user_id,
        set_code,
        default_price_cents=int(round(default_price * 100)),
        game=game,
    )


@router.get("/runtime/judge/seller/catalog/games")
async def seller_catalog_games(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    games = await seller_cat.list_seller_games(session, user_id)
    return {"games": games}


@router.get("/runtime/judge/seller/inventory/search")
async def seller_inventory_search(
    session: DbSession,
    source: Literal["my_catalog", "system", "bestsellers_marketplace", "bestsellers_store"] = "my_catalog",
    kind: Literal["cards", "products"] = "cards",
    game: str = "mtg",
    q: str | None = None,
    stock_filter: Literal["all", "with_stock", "without_stock"] = "all",
    period: Literal["day", "week", "month", "year"] = "month",
    page: int = 1,
    limit: int = 24,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_inv.search_inventory(
        session,
        user_id,
        source=source,
        kind=kind,
        game=game,
        q=q,
        stock_filter=stock_filter,
        period=period,
        page=page,
        limit=limit,
    )


@router.post("/runtime/judge/seller/inventory/adjust")
async def seller_inventory_adjust(
    session: DbSession,
    body: InventoryAdjustBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_inv.adjust_inventory(
        session,
        user_id,
        kind=body.kind,
        mode=body.mode,
        quantity=body.quantity,
        listing_id=body.listing_id,
        product_id=body.product_id,
        card_id=body.card_id,
        price_cents=body.price_cents,
        condition=body.condition,
        language=body.language,
        foil=body.foil,
        title=body.title,
        category=body.category,
    )


@router.get("/runtime/judge/seller/inventory/dashboard")
async def seller_inventory_dashboard(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_inv_dash.get_inventory_dashboard(session, user_id)


@router.get("/runtime/judge/seller/inventory/analytics")
async def seller_inventory_analytics(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_inv_analytics.get_inventory_analytics(session, user_id)


@router.post("/runtime/judge/seller/inventory/export")
async def seller_inventory_export(
    session: DbSession,
    body: InventoryExportBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_inv_export.export_inventory(
        session,
        user_id,
        fmt=body.format,
        source=body.source,
        kind=body.kind,
        game=body.game,
        q=body.q,
        ids=body.ids,
    )


@router.post("/runtime/judge/seller/inventory/bulk")
async def seller_inventory_bulk(
    session: DbSession,
    body: InventoryBulkBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_inv_bulk.bulk_inventory(
        session,
        user_id,
        action=body.action,
        items=body.items,
        quantity=body.quantity,
    )


@router.post("/runtime/judge/seller/inventory/import-csv")
async def seller_inventory_import_csv(
    session: DbSession,
    body: InventoryImportBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    store = await seller_dash.resolve_owner_store(session, user_id)
    return await shop_inv.import_products_csv(
        session,
        str(store["id"]),
        user_id,
        body.csv,
        dry_run=body.dry_run,
    )


@router.get("/runtime/judge/seller/products")
async def seller_products_list(
    session: DbSession,
    category: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 25,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    store = await seller_dash.resolve_owner_store(session, user_id)
    return await shop_products_svc.list_seller_products(
        session,
        str(store["id"]),
        user_id,
        category=category,
        search=search,
        page=page,
        limit=limit,
    )


@router.post("/runtime/judge/seller/products")
async def seller_product_create(
    session: DbSession,
    body: ProductCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    store = await seller_dash.resolve_owner_store(session, user_id)
    product = await shop_products_svc.create_product(
        session,
        str(store["id"]),
        user_id,
        name=body.name,
        description=body.description,
        tcg_id=body.tcg_id,
        category=body.category,
        price_cents=int(round(body.price * 100)),
        stock=body.quantity,
        sku=body.sku,
    )
    return {"product": product}


@router.patch("/runtime/judge/seller/products/{product_id}")
async def seller_product_patch(
    session: DbSession,
    product_id: str,
    body: ProductUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    fields: dict[str, Any] = {}
    if body.name is not None:
        fields["name"] = body.name
    if body.description is not None:
        fields["description"] = body.description
    if body.category is not None:
        fields["category"] = body.category
    if body.price is not None:
        fields["price_cents"] = int(round(body.price * 100))
    if body.quantity is not None:
        fields["stock"] = body.quantity
    if body.sku is not None:
        fields["sku"] = body.sku
    if body.is_active is not None:
        fields["is_active"] = body.is_active
    product = await shop_products_svc.update_product(session, product_id, user_id, fields)
    return {"product": product}


@router.delete("/runtime/judge/seller/products/{product_id}")
async def seller_product_delete(
    session: DbSession,
    product_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    product = await shop_products_svc.update_product(
        session, product_id, user_id, {"is_active": False}
    )
    return {"product": product}


@router.get("/runtime/judge/seller/customers")
async def seller_customers_list(
    session: DbSession,
    search: str | None = None,
    segment: str | None = None,
    page: int = 1,
    limit: int = 25,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_cust.list_seller_customers(
        session, user_id, search=search, segment=segment, page=page, limit=limit
    )


@router.get("/runtime/judge/seller/customers/{customer_id}")
async def seller_customer_detail(
    session: DbSession,
    customer_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    customer = await seller_cust.get_customer_detail(session, user_id, customer_id)
    return {"customer": customer}


@router.get("/runtime/judge/seller/customers/{customer_id}/orders")
async def seller_customer_orders(
    session: DbSession,
    customer_id: str,
    limit: int = 20,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    orders = await seller_cust.list_customer_orders(session, user_id, customer_id, limit=limit)
    return {"orders": orders}


@router.get("/runtime/judge/seller/customers/{customer_id}/gamification")
async def seller_customer_gamification(
    session: DbSession,
    customer_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_cust.get_customer_gamification(session, user_id, customer_id)


@router.get("/runtime/judge/seller/tickets")
async def seller_tickets_list(
    session: DbSession,
    status: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 25,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_tix.list_tickets(
        session,
        user_id,
        status=status,
        category=category,
        priority=priority,
        search=search,
        page=page,
        limit=limit,
    )


@router.post("/runtime/judge/seller/tickets")
async def seller_ticket_create(
    session: DbSession,
    body: TicketCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    ticket = await seller_tix.create_ticket(
        session,
        user_id,
        subject=body.subject,
        category=body.category,
        priority=body.priority,
        customer_id=body.customer_id,
        order_id=body.order_id,
        initial_message=body.message,
    )
    return {"ticket": ticket}


@router.get("/runtime/judge/seller/tickets/{ticket_id}")
async def seller_ticket_detail(
    session: DbSession,
    ticket_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_tix.get_ticket(session, user_id, ticket_id)


@router.post("/runtime/judge/seller/tickets/{ticket_id}/messages")
async def seller_ticket_message(
    session: DbSession,
    ticket_id: str,
    body: TicketMessageBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    message = await seller_tix.add_ticket_message(
        session,
        user_id,
        ticket_id,
        content=body.content,
        is_internal=body.is_internal,
    )
    return {"message": message}


@router.patch("/runtime/judge/seller/tickets/{ticket_id}/status")
async def seller_ticket_status(
    session: DbSession,
    ticket_id: str,
    body: TicketStatusBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    ticket = await seller_tix.update_ticket_status(session, user_id, ticket_id, body.status)
    return {"ticket": ticket}


@router.patch("/runtime/judge/seller/tickets/{ticket_id}/assign")
async def seller_ticket_assign(
    session: DbSession,
    ticket_id: str,
    body: TicketAssignBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    ticket = await seller_tix.assign_ticket(session, user_id, ticket_id, body.assignee_id)
    return {"ticket": ticket}


@router.get("/runtime/judge/seller/team/me")
async def seller_team_me(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    store = await seller_dash.resolve_owner_store(session, user_id)
    owner_id = str(store.get("owner_id") or user_id)
    role = await seller_team_svc.get_user_role(
        session, str(store["id"]), user_id, owner_id=owner_id
    )
    return {"role": role}


@router.get("/runtime/judge/seller/team/users")
async def seller_team_users(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    users = await seller_team_svc.list_team_users(session, user_id)
    return {"users": users}


@router.post("/runtime/judge/seller/team/users")
async def seller_team_invite(
    session: DbSession,
    body: TeamInviteBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    member = await seller_team_svc.invite_team_user(
        session, user_id, email=body.email, role=body.role, display_name=body.display_name
    )
    return {"user": member}


@router.patch("/runtime/judge/seller/team/users/{member_user_id}/role")
async def seller_team_role_patch(
    session: DbSession,
    member_user_id: str,
    body: TeamRoleBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    member = await seller_team_svc.update_user_role(session, user_id, member_user_id, body.role)
    return {"user": member}


@router.patch("/runtime/judge/seller/team/users/{member_user_id}/permissions")
async def seller_team_permissions_patch(
    session: DbSession,
    member_user_id: str,
    body: TeamPermissionsBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    member = await seller_team_svc.update_user_permissions(
        session, user_id, member_user_id, body.permissions
    )
    return {"user": member}


@router.get("/runtime/judge/seller/team/logs")
async def seller_team_logs(
    session: DbSession,
    user_id: str | None = None,
    action: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    page: int = 1,
    limit: int = 50,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    actor_id = _require_user(x_judge_user_id)
    from datetime import date as date_type

    df = date_type.fromisoformat(date_from) if date_from else None
    dt = date_type.fromisoformat(date_to) if date_to else None
    return await seller_team_svc.list_audit_logs(
        session,
        actor_id,
        user_id=user_id,
        action=action,
        date_from=df,
        date_to=dt,
        page=page,
        limit=limit,
    )


@router.get("/runtime/judge/seller/finance/revenue")
async def seller_finance_revenue(
    session: DbSession,
    period: Literal["7d", "30d", "90d", "custom"] = "30d",
    date_from: str | None = None,
    date_to: str | None = None,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_fin.get_revenue_report(
        session, user_id, period=period, date_from=date_from, date_to=date_to
    )


@router.get("/runtime/judge/seller/finance/payouts")
async def seller_finance_payouts(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_fin.get_payouts_summary(session, user_id)


@router.get("/runtime/judge/seller/finance/stripe")
async def seller_finance_stripe(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_fin.get_stripe_summary(session, user_id)


@router.get("/runtime/judge/seller/finance/pix")
async def seller_finance_pix(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_fin.get_pix_summary(session, user_id)


@router.get("/runtime/judge/seller/finance/reconciliation")
async def seller_finance_reconciliation(
    session: DbSession,
    limit: int = 100,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.payments.reconciliation import get_reconciliation_report

    user_id = _require_user(x_judge_user_id)
    return await get_reconciliation_report(session, user_id, limit=limit)


@router.get("/runtime/judge/seller/finance/chargebacks")
async def seller_finance_chargebacks(
    session: DbSession,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.payments.reconciliation import get_chargebacks_list

    user_id = _require_user(x_judge_user_id)
    return await get_chargebacks_list(
        session, user_id, status=status, limit=limit, offset=offset
    )


@router.get("/runtime/judge/seller/finance/audit-trail")
async def seller_finance_audit_trail(
    session: DbSession,
    limit: int = 50,
    offset: int = 0,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.payments.reconciliation import get_audit_trail

    user_id = _require_user(x_judge_user_id)
    return await get_audit_trail(session, user_id, limit=limit, offset=offset)


@router.get("/runtime/judge/seller/reputation")
async def seller_reputation_get(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace.seller_dashboard import resolve_owner_store
    from app.reputation.reputation_engine import get_seller_reputation_dashboard

    user_id = _require_user(x_judge_user_id)
    store = await resolve_owner_store(session, user_id)
    return await get_seller_reputation_dashboard(session, str(store["id"]))


@router.get("/runtime/judge/seller/reputation/history")
async def seller_reputation_history(
    session: DbSession,
    limit: int = 30,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace.seller_dashboard import resolve_owner_store
    from sqlalchemy import text

    user_id = _require_user(x_judge_user_id)
    store = await resolve_owner_store(session, user_id)
    rows = (
        await session.execute(
            text(
                """
                SELECT from_score, to_score, from_level, to_level, event_type, version, created_at
                FROM tcg_judge.reputation_score_history
                WHERE store_id = CAST(:sid AS uuid)
                ORDER BY created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": str(store["id"]), "lim": limit},
        )
    ).mappings().all()
    return {"history": [dict(r) for r in rows]}


@router.get("/runtime/judge/seller/intelligence")
async def seller_intelligence_dashboard(
    session: DbSession,
    period: Literal["7d", "30d", "90d"] = "30d",
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.analytics.intelligence_service import get_intelligence_dashboard

    user_id = _require_user(x_judge_user_id)
    return await get_intelligence_dashboard(session, user_id, period=period)


@router.get("/runtime/judge/seller/intelligence/insights")
async def seller_intelligence_insights(
    session: DbSession,
    period: Literal["7d", "30d", "90d"] = "30d",
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.analytics.intelligence_service import get_sales_insights

    user_id = _require_user(x_judge_user_id)
    return await get_sales_insights(session, user_id, period=period)


@router.get("/runtime/judge/seller/intelligence/listings")
async def seller_intelligence_listings(
    session: DbSession,
    limit: int = 30,
    sort: str = "revenue",
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.analytics.intelligence_service import get_listing_performance

    user_id = _require_user(x_judge_user_id)
    return await get_listing_performance(session, user_id, limit=limit, sort=sort)


@router.get("/runtime/judge/seller/intelligence/pricing")
async def seller_intelligence_pricing(
    session: DbSession,
    limit: int = 30,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.analytics.pricing_intelligence import get_pricing_suggestions_read
    from app.marketplace.seller_dashboard import resolve_owner_store

    user_id = _require_user(x_judge_user_id)
    store = await resolve_owner_store(session, user_id)
    return await get_pricing_suggestions_read(session, store_id=str(store["id"]), limit=limit)


@router.get("/runtime/judge/seller/intelligence/churn")
async def seller_intelligence_churn(
    session: DbSession,
    limit: int = 20,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.analytics.churn_scoring import get_churn_at_risk
    from app.marketplace.seller_dashboard import resolve_owner_store

    user_id = _require_user(x_judge_user_id)
    store = await resolve_owner_store(session, user_id)
    return await get_churn_at_risk(session, store_id=str(store["id"]), limit=limit)


@router.get("/runtime/judge/seller/settings/notifications")
async def seller_notification_settings_get(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    settings = await seller_fin.get_notification_settings(session, user_id)
    return {"settings": settings}


@router.put("/runtime/judge/seller/settings/notifications")
async def seller_notification_settings_put(
    session: DbSession,
    body: NotificationSettingsBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    settings = await seller_fin.update_notification_settings(session, user_id, body.settings)
    return {"settings": settings}


@router.get("/runtime/judge/seller/search/global")
async def seller_global_search(
    session: DbSession,
    q: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    if len(q.strip()) < 2:
        raise HTTPException(400, "Query muito curta")
    return await seller_search_svc.global_search(session, user_id, q)


@router.get("/runtime/judge/seller/notifications/header")
async def seller_header_notifications(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_hdr_notif.get_header_notifications(session, user_id)
