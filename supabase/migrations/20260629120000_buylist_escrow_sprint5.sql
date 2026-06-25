-- Sprint 5: BuyList escrow + itens de pedido sem produto físico
SET search_path TO tcg_judge, public;

ALTER TABLE shop_order_items ALTER COLUMN product_id DROP NOT NULL;

COMMENT ON COLUMN shop_order_items.product_id IS 'NULL para linhas BuyList/coleção sem SKU de loja';
