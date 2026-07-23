-- Fix category CHECK values (UTF-8 accents) if previous apply mangled escapes.
ALTER TABLE pdv.local_products DROP CONSTRAINT IF EXISTS local_products_category_check;
ALTER TABLE pdv.local_products ADD CONSTRAINT local_products_category_check
  CHECK (category IN ('Snack', 'Bebida', 'Booster', 'Serviço', 'Taxa', 'Acessório', 'Outros'));
