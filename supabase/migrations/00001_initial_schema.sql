-- ============================================
-- Sistema de Gestión Óptica — Schema Inicial
-- Migración: 00001_initial_schema
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE rol_admin AS ENUM ('DUENO', 'VENDEDOR');

CREATE TYPE estado_cita AS ENUM (
  'PRE_RESERVA',
  'PENDIENTE',
  'CONFIRMADA',
  'COMPLETADA',
  'CANCELADA',
  'NO_ASISTIO'
);

CREATE TYPE motivo_cancelacion AS ENUM (
  'CAMBIO_PLANES',
  'ME_QUEDA_LEJOS',
  'PRECIO',
  'OTRO'
);

CREATE TYPE preferencia_contacto AS ENUM ('EMAIL', 'WHATSAPP', 'AMBOS');

CREATE TYPE estado_lista_espera AS ENUM ('ESPERANDO', 'NOTIFICADO', 'CONFIRMADO', 'EXPIRADO', 'REMOVIDO');

CREATE TYPE prioridad_precio AS ENUM ('FIJO', 'PRODUCTO', 'CATEGORIA', 'PROVEEDOR');

CREATE TYPE nivel_descuento AS ENUM ('GLOBAL', 'CATEGORIA', 'PROVEEDOR', 'PRODUCTO', 'TEMPORAL');

CREATE TYPE modo_acumulacion_descuento AS ENUM ('MAS_ESPECIFICO', 'ACUMULADO', 'ACUMULADO_CON_TOPE');

CREATE TYPE estado_pedido AS ENUM ('BORRADOR', 'ENVIADO', 'EN_TRANSITO', 'RECIBIDO_PARCIAL', 'RECIBIDO', 'CANCELADO');

CREATE TYPE origen_movimiento AS ENUM ('MANUAL', 'VENTA', 'PEDIDO', 'AJUSTE', 'DEVOLUCION', 'ALIBABA_API');

CREATE TYPE tipo_movimiento AS ENUM ('ENTRADA', 'SALIDA');

CREATE TYPE metodo_pago AS ENUM ('EFECTIVO', 'DEBITO', 'CREDITO', 'TRANSFERENCIA');

CREATE TYPE estado_venta AS ENUM ('EN_PROGRESO', 'COMPLETADA', 'ANULADA');

CREATE TYPE verificacion_identidad AS ENUM ('PRESENCIAL', 'FAMILIAR_AUTORIZADO', 'COMPROBANTE');

CREATE TYPE nivel_alerta_stock AS ENUM ('MEDIO', 'BAJO', 'AGOTADO');

CREATE TYPE estado_notificacion AS ENUM ('PENDIENTE', 'ENVIADA', 'FALLIDA', 'CANCELADA');

CREATE TYPE canal_notificacion AS ENUM ('EMAIL', 'WHATSAPP');

CREATE TYPE tipo_notificacion AS ENUM (
  'VERIFICACION',
  'CONFIRMACION_CITA',
  'RECORDATORIO_24H',
  'CANCELACION',
  'RETENCION_3D',
  'RETENCION_7D',
  'LISTA_ESPERA',
  'ENCUESTA',
  'RECORDATORIO_REVISION',
  'CUMPLEANOS',
  'ALERTA_STOCK',
  'PEDIDO_EN_CAMINO'
);

CREATE TYPE criterio_umbral_stock AS ENUM ('CANTIDAD_FIJA', 'PORCENTAJE', 'AMBOS');

-- FIX #25: Armazones y Monturas son lo mismo en óptica, simplificado a 2 categorías
CREATE TYPE categoria_producto AS ENUM ('ARMAZONES', 'ACCESORIOS');

-- FIX #28: Usar ENUM en vez de VARCHAR+CHECK para tipo_cambio_modo
CREATE TYPE tipo_cambio_modo AS ENUM ('AUTO', 'MANUAL');

-- FIX #23: Usar ENUM en vez de VARCHAR para periodo de métricas
CREATE TYPE periodo_metrica AS ENUM ('diario', 'semanal', 'mensual');

-- ============================================
-- TABLAS
-- ============================================

-- Admin / Usuarios del sistema
CREATE TABLE admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL, -- referencia a auth.users de Supabase
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  rol rol_admin NOT NULL DEFAULT 'DUENO',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuración general de la óptica
CREATE TABLE configuracion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_optica VARCHAR(200) NOT NULL,
  logo_url TEXT,
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(255),
  moneda_local VARCHAR(3) NOT NULL DEFAULT 'CLP',
  tipo_cambio_modo tipo_cambio_modo NOT NULL DEFAULT 'AUTO', -- FIX #28: ENUM
  limite_citas_dia INTEGER NOT NULL DEFAULT 10,
  descuento_maximo NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  modo_acumulacion_descuento modo_acumulacion_descuento NOT NULL DEFAULT 'MAS_ESPECIFICO',
  max_cancelaciones_mes INTEGER NOT NULL DEFAULT 2,
  duracion_reserva_stock_min INTEGER NOT NULL DEFAULT 15,
  preferencia_contacto_default preferencia_contacto NOT NULL DEFAULT 'AMBOS',
  google_maps_embed TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Horarios de atención por día de la semana
CREATE TABLE horario_semanal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  activo BOOLEAN NOT NULL DEFAULT true,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dia_semana),
  CONSTRAINT chk_horario_orden CHECK (hora_fin > hora_inicio) -- FIX #5
);

-- Tipos de cita con duración propia
CREATE TABLE tipo_cita (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  duracion_min INTEGER NOT NULL CHECK (duracion_min > 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bloqueos de agenda (feriados, vacaciones, etc.)
CREATE TABLE bloqueo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  motivo VARCHAR(200),
  creado_por UUID REFERENCES admin(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- FIX #27
  CHECK (fecha_fin >= fecha_inicio)
);

-- Pacientes / Clientes
CREATE TABLE paciente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  fecha_nacimiento DATE,
  preferencia_contacto preferencia_contacto NOT NULL DEFAULT 'AMBOS',
  whatsapp_bloqueado BOOLEAN NOT NULL DEFAULT false, -- FIX #19
  proxima_revision DATE,
  cancelaciones_mes INTEGER NOT NULL DEFAULT 0,
  cancelaciones_mes_reset DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
  notas TEXT,
  eliminado BOOLEAN NOT NULL DEFAULT false,
  eliminado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- FIX #12: Soft delete consistency
  CONSTRAINT chk_paciente_soft_delete CHECK (
    (eliminado = false AND eliminado_at IS NULL) OR
    (eliminado = true AND eliminado_at IS NOT NULL)
  )
);

-- FIX #7: Email único por paciente no eliminado
CREATE UNIQUE INDEX idx_paciente_email_unique ON paciente(email) WHERE eliminado = false;

-- Sesiones anónimas para identificación sin cuenta
CREATE TABLE sesion_anonima (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID REFERENCES paciente(id) ON DELETE RESTRICT, -- FIX #11
  fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Citas
CREATE TABLE cita (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES paciente(id) ON DELETE RESTRICT, -- FIX #11
  tipo_cita_id UUID NOT NULL REFERENCES tipo_cita(id),
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_min INTEGER NOT NULL, -- snapshot de la duración al crear
  estado estado_cita NOT NULL DEFAULT 'PRE_RESERVA',
  token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(), -- link único del cliente
  codigo_verificacion VARCHAR(6),
  codigo_verificacion_expira TIMESTAMPTZ,
  motivo_cancelacion motivo_cancelacion,
  motivo_cancelacion_texto TEXT,
  cancelado_por VARCHAR(10) CHECK (cancelado_por IN ('CLIENTE', 'ADMIN')),
  notas_admin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cita_hora_orden CHECK (hora_fin > hora_inicio), -- FIX #6
  -- FIX #18: Código de verificación debe ser 6 dígitos
  CONSTRAINT chk_cita_codigo_verificacion CHECK (
    codigo_verificacion IS NULL OR codigo_verificacion ~ '^\d{6}$'
  )
);

-- FIX #26: Máximo 1 cita activa por paciente
CREATE UNIQUE INDEX idx_cita_paciente_activa
  ON cita(paciente_id)
  WHERE estado IN ('PRE_RESERVA', 'PENDIENTE', 'CONFIRMADA');

-- Lista de espera
CREATE TABLE lista_espera (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES paciente(id) ON DELETE RESTRICT,
  tipo_cita_id UUID NOT NULL REFERENCES tipo_cita(id),
  fecha_preferida DATE,
  estado estado_lista_espera NOT NULL DEFAULT 'ESPERANDO',
  notificado_at TIMESTAMPTZ,
  expira_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recetas ópticas (no se pueden eliminar)
CREATE TABLE receta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES paciente(id) ON DELETE RESTRICT, -- FIX #11
  cita_id UUID REFERENCES cita(id),
  creado_por UUID NOT NULL REFERENCES admin(id),

  -- Ojo derecho (OD)
  od_esfera NUMERIC(5,2),
  od_cilindro NUMERIC(5,2),
  od_eje INTEGER CHECK (od_eje IS NULL OR (od_eje >= 0 AND od_eje <= 180)),
  od_adicion NUMERIC(5,2),
  od_agudeza_visual VARCHAR(20),

  -- Ojo izquierdo (OI)
  oi_esfera NUMERIC(5,2),
  oi_cilindro NUMERIC(5,2),
  oi_eje INTEGER CHECK (oi_eje IS NULL OR (oi_eje >= 0 AND oi_eje <= 180)),
  oi_adicion NUMERIC(5,2),
  oi_agudeza_visual VARCHAR(20),

  distancia_pupilar NUMERIC(4,1),
  observaciones TEXT,
  proxima_revision DATE,
  reemplaza_a UUID REFERENCES receta(id), -- si es corrección de otra receta

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- SIN updated_at ni deleted_at: las recetas son inmutables
);

-- Proveedores
CREATE TABLE proveedor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  url_alibaba TEXT,
  tiempo_entrega_dias INTEGER,
  multiplicador NUMERIC(5,2) DEFAULT 2.5,
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categorías de producto
CREATE TABLE categoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  tipo categoria_producto NOT NULL,
  multiplicador NUMERIC(5,2) DEFAULT 2.5,
  umbral_stock_medio INTEGER DEFAULT 10,
  umbral_stock_minimo INTEGER DEFAULT 3,
  criterio_umbral criterio_umbral_stock NOT NULL DEFAULT 'CANTIDAD_FIJA',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Productos
CREATE TABLE producto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(300) NOT NULL,
  sku VARCHAR(50) UNIQUE,
  categoria_id UUID NOT NULL REFERENCES categoria(id),
  proveedor_id UUID REFERENCES proveedor(id),

  -- Precios
  precio_compra_usd NUMERIC(10,2), -- precio en USD (moneda de Alibaba)
  precio_compra_clp NUMERIC(10,0), -- precio convertido a CLP
  precio_venta_fijo NUMERIC(10,0), -- si el admin fija precio manual
  multiplicador NUMERIC(5,2), -- multiplicador propio del producto

  -- Stock
  stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_optimo INTEGER DEFAULT 20,
  umbral_stock_medio INTEGER,
  umbral_stock_minimo INTEGER,

  -- Alibaba
  alibaba_product_url TEXT,
  alibaba_order_id VARCHAR(100),

  -- Metadata
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  eliminado BOOLEAN NOT NULL DEFAULT false,
  eliminado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- FIX #12: Soft delete consistency
  CONSTRAINT chk_producto_soft_delete CHECK (
    (eliminado = false AND eliminado_at IS NULL) OR
    (eliminado = true AND eliminado_at IS NOT NULL)
  )
);

-- Imágenes de productos
CREATE TABLE producto_imagen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  es_principal BOOLEAN NOT NULL DEFAULT false,
  origen VARCHAR(20) NOT NULL DEFAULT 'MANUAL' CHECK (origen IN ('MANUAL', 'ALIBABA')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reglas de descuento (antes de venta_item que la referencia)
CREATE TABLE regla_descuento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  nivel nivel_descuento NOT NULL,
  porcentaje NUMERIC(5,2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),

  -- Aplica según nivel
  categoria_id UUID REFERENCES categoria(id),
  proveedor_id UUID REFERENCES proveedor(id),
  producto_id UUID REFERENCES producto(id),

  -- Temporal
  fecha_inicio DATE,
  fecha_fin DATE,

  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (nivel = 'GLOBAL' AND categoria_id IS NULL AND proveedor_id IS NULL AND producto_id IS NULL) OR
    (nivel = 'CATEGORIA' AND categoria_id IS NOT NULL AND proveedor_id IS NULL AND producto_id IS NULL) OR
    (nivel = 'PROVEEDOR' AND categoria_id IS NULL AND proveedor_id IS NOT NULL AND producto_id IS NULL) OR
    (nivel = 'PRODUCTO' AND categoria_id IS NULL AND proveedor_id IS NULL AND producto_id IS NOT NULL) OR
    (nivel = 'TEMPORAL' AND fecha_inicio IS NOT NULL AND fecha_fin IS NOT NULL)
  ),
  -- FIX #13: Validar fechas de descuentos temporales
  CONSTRAINT chk_regla_descuento_fechas CHECK (
    fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin >= fecha_inicio
  )
);

-- Ventas
CREATE TABLE venta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES paciente(id) ON DELETE RESTRICT, -- FIX #11
  receta_id UUID REFERENCES receta(id),
  admin_id UUID NOT NULL REFERENCES admin(id),
  verificacion verificacion_identidad NOT NULL,
  estado estado_venta NOT NULL DEFAULT 'EN_PROGRESO',
  metodo_pago metodo_pago,
  subtotal NUMERIC(10,0) NOT NULL DEFAULT 0,
  descuento_total NUMERIC(10,0) NOT NULL DEFAULT 0,
  total NUMERIC(10,0) NOT NULL DEFAULT 0,
  monto_pagado NUMERIC(10,0),
  vuelto NUMERIC(10,0),
  motivo_sin_receta TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items de cada venta (snapshot de precios)
CREATE TABLE venta_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES producto(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,0) NOT NULL,
  descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  descuento_monto NUMERIC(10,0) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,0) NOT NULL,
  regla_descuento_id UUID REFERENCES regla_descuento(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FIX #1: Pedidos ANTES de movimiento_stock (que lo referencia)
-- Pedidos a proveedores
CREATE TABLE pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proveedor_id UUID NOT NULL REFERENCES proveedor(id),
  estado estado_pedido NOT NULL DEFAULT 'BORRADOR',
  total_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_clp NUMERIC(10,0) NOT NULL DEFAULT 0,
  tipo_cambio_usado NUMERIC(10,2),
  fecha_envio DATE,
  fecha_recepcion_estimada DATE,
  fecha_recepcion_real DATE,
  notas TEXT,
  creado_por UUID NOT NULL REFERENCES admin(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items de cada pedido
CREATE TABLE pedido_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES producto(id),
  cantidad_pedida INTEGER NOT NULL CHECK (cantidad_pedida > 0),
  cantidad_recibida INTEGER NOT NULL DEFAULT 0,
  precio_unitario_usd NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- FIX #24: Validar cantidad recibida
  CONSTRAINT chk_pedido_item_cantidad_recibida CHECK (
    cantidad_recibida >= 0 AND cantidad_recibida <= cantidad_pedida
  )
);

-- Movimientos de stock (ahora pedido ya existe)
CREATE TABLE movimiento_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES producto(id) ON DELETE RESTRICT, -- FIX #11
  tipo tipo_movimiento NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  origen origen_movimiento NOT NULL,
  venta_id UUID REFERENCES venta(id),
  pedido_id UUID REFERENCES pedido(id),
  nota TEXT,
  creado_por UUID REFERENCES admin(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tipo de cambio USD/CLP
CREATE TABLE tipo_cambio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moneda_origen VARCHAR(3) NOT NULL DEFAULT 'USD',
  moneda_destino VARCHAR(3) NOT NULL DEFAULT 'CLP',
  tasa NUMERIC(10,2) NOT NULL,
  fecha DATE NOT NULL,
  fuente VARCHAR(50) NOT NULL DEFAULT 'exchangerate-api',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (moneda_origen, moneda_destino, fecha)
);

-- Alertas de stock
CREATE TABLE alerta_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES producto(id),
  nivel nivel_alerta_stock NOT NULL,
  stock_al_momento INTEGER NOT NULL,
  notificado BOOLEAN NOT NULL DEFAULT false,
  notificado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reserva temporal de stock durante ventas
CREATE TABLE reserva_stock_temporal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES producto(id),
  venta_id UUID NOT NULL REFERENCES venta(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  expira_at TIMESTAMPTZ NOT NULL,
  liberada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Encuestas post-cita
CREATE TABLE encuesta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES paciente(id) ON DELETE RESTRICT,
  cita_id UUID NOT NULL REFERENCES cita(id),
  token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  calificacion SMALLINT CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  respondida BOOLEAN NOT NULL DEFAULT false,
  respondida_at TIMESTAMPTZ,
  aprobada_para_publica BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recordatorios de revisión anual
CREATE TABLE recordatorio_revision (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES paciente(id) ON DELETE RESTRICT,
  receta_id UUID NOT NULL REFERENCES receta(id),
  fecha_revision DATE NOT NULL,
  enviado_30d BOOLEAN NOT NULL DEFAULT false,
  enviado_15d BOOLEAN NOT NULL DEFAULT false,
  enviado_7d BOOLEAN NOT NULL DEFAULT false,
  cancelado BOOLEAN NOT NULL DEFAULT false, -- se cancela si el paciente reserva
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Control de emails de cumpleaños (1 por año)
CREATE TABLE cumpleanos_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES paciente(id) ON DELETE RESTRICT,
  anio INTEGER NOT NULL,
  codigo_descuento VARCHAR(50) UNIQUE NOT NULL,
  descuento_porcentaje NUMERIC(5,2) NOT NULL,
  valido_hasta DATE NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT false,
  enviado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (paciente_id, anio) -- solo 1 email por paciente por año
);

-- Cola de notificaciones programadas
CREATE TABLE notificacion_programada (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID REFERENCES paciente(id),
  cita_id UUID REFERENCES cita(id),
  tipo tipo_notificacion NOT NULL,
  canal canal_notificacion NOT NULL DEFAULT 'EMAIL',
  estado estado_notificacion NOT NULL DEFAULT 'PENDIENTE',
  programada_para TIMESTAMPTZ NOT NULL,
  intentos INTEGER NOT NULL DEFAULT 0,
  max_intentos INTEGER NOT NULL DEFAULT 3,
  ultimo_intento_at TIMESTAMPTZ,
  proximo_intento_at TIMESTAMPTZ,
  error_mensaje TEXT,
  metadata JSONB, -- datos variables para el template
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log de emails enviados
CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID REFERENCES paciente(id),
  notificacion_id UUID REFERENCES notificacion_programada(id),
  destinatario VARCHAR(255) NOT NULL,
  asunto VARCHAR(500) NOT NULL,
  tipo tipo_notificacion NOT NULL,
  canal canal_notificacion NOT NULL DEFAULT 'EMAIL',
  exitoso BOOLEAN NOT NULL,
  resend_id VARCHAR(100), -- ID de Resend para tracking
  error_mensaje TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log de webhooks de Alibaba (idempotencia)
CREATE TABLE webhook_alibaba_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id VARCHAR(200) UNIQUE NOT NULL, -- ID único del webhook para idempotencia
  evento VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  procesado BOOLEAN NOT NULL DEFAULT false,
  procesado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Caché de métricas del dashboard
CREATE TABLE metrica_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  periodo periodo_metrica NOT NULL, -- FIX #23: ENUM en vez de VARCHAR
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auditoría de acciones
CREATE TABLE auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin(id),
  paciente_id UUID REFERENCES paciente(id),
  accion VARCHAR(100) NOT NULL,
  tabla_afectada VARCHAR(100),
  registro_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FIX #14: Control de intentos de login (complementa Supabase Auth)
CREATE TABLE login_attempt (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL,
  email VARCHAR(255),
  exitoso BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FUNCIONES DE UTILIDAD
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS updated_at
-- ============================================

CREATE TRIGGER trg_admin_updated_at BEFORE UPDATE ON admin FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_configuracion_updated_at BEFORE UPDATE ON configuracion FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_horario_semanal_updated_at BEFORE UPDATE ON horario_semanal FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tipo_cita_updated_at BEFORE UPDATE ON tipo_cita FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bloqueo_updated_at BEFORE UPDATE ON bloqueo FOR EACH ROW EXECUTE FUNCTION update_updated_at(); -- FIX #27
CREATE TRIGGER trg_paciente_updated_at BEFORE UPDATE ON paciente FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cita_updated_at BEFORE UPDATE ON cita FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_lista_espera_updated_at BEFORE UPDATE ON lista_espera FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_proveedor_updated_at BEFORE UPDATE ON proveedor FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categoria_updated_at BEFORE UPDATE ON categoria FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_producto_updated_at BEFORE UPDATE ON producto FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_venta_updated_at BEFORE UPDATE ON venta FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_regla_descuento_updated_at BEFORE UPDATE ON regla_descuento FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pedido_updated_at BEFORE UPDATE ON pedido FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_recordatorio_revision_updated_at BEFORE UPDATE ON recordatorio_revision FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notificacion_programada_updated_at BEFORE UPDATE ON notificacion_programada FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_metrica_cache_updated_at BEFORE UPDATE ON metrica_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at();
