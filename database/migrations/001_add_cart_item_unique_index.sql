ALTER TABLE cart_items
  ADD UNIQUE KEY cart_id_product_id_unique (cart_id, product_id);
