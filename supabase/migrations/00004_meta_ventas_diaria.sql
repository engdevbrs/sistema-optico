-- Add daily sales goal to configuration
ALTER TABLE configuracion
  ADD COLUMN meta_ventas_diaria NUMERIC(10,0) NOT NULL DEFAULT 200000;
