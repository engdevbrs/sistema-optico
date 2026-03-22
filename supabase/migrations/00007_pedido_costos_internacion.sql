-- Costos de internación para pedidos internacionales
ALTER TABLE pedido
  ADD COLUMN costo_envio_usd NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN seguro_usd NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN cif_usd NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN arancel_usd NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN iva_importacion_usd NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN total_landed_usd NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN total_landed_clp NUMERIC(10,0) DEFAULT 0;
