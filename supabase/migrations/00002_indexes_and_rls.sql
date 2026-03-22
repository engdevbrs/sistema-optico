-- ============================================
-- Índices para performance
-- ============================================

-- Pacientes
-- (email ya tiene UNIQUE INDEX parcial en 00001)
CREATE INDEX idx_paciente_telefono ON paciente(telefono) WHERE telefono IS NOT NULL;
CREATE INDEX idx_paciente_eliminado ON paciente(eliminado) WHERE eliminado = false;
CREATE INDEX idx_paciente_fecha_nacimiento ON paciente(fecha_nacimiento) WHERE fecha_nacimiento IS NOT NULL;
CREATE INDEX idx_paciente_proxima_revision ON paciente(proxima_revision) WHERE proxima_revision IS NOT NULL;

-- Citas
CREATE INDEX idx_cita_paciente ON cita(paciente_id);
CREATE INDEX idx_cita_fecha ON cita(fecha);
CREATE INDEX idx_cita_estado ON cita(estado);
-- FIX #4: Eliminado idx_cita_token (redundante con UNIQUE constraint)
CREATE INDEX idx_cita_fecha_estado ON cita(fecha, estado);
-- FIX #15: Índice compuesto para queries de disponibilidad
CREATE INDEX idx_cita_disponibilidad
  ON cita(fecha, hora_inicio, hora_fin)
  WHERE estado NOT IN ('CANCELADA', 'NO_ASISTIO');

-- Lista de espera
CREATE INDEX idx_lista_espera_estado ON lista_espera(estado);
CREATE INDEX idx_lista_espera_paciente ON lista_espera(paciente_id);

-- Recetas
CREATE INDEX idx_receta_paciente ON receta(paciente_id);
CREATE INDEX idx_receta_cita ON receta(cita_id) WHERE cita_id IS NOT NULL;
CREATE INDEX idx_receta_proxima_revision ON receta(proxima_revision) WHERE proxima_revision IS NOT NULL;

-- Productos
CREATE INDEX idx_producto_categoria ON producto(categoria_id);
CREATE INDEX idx_producto_proveedor ON producto(proveedor_id) WHERE proveedor_id IS NOT NULL;
CREATE INDEX idx_producto_stock ON producto(stock_actual);
CREATE INDEX idx_producto_activo ON producto(activo) WHERE activo = true;
-- FIX #9: Eliminado idx_producto_sku (redundante con UNIQUE constraint)

-- Producto imágenes
CREATE INDEX idx_producto_imagen_producto ON producto_imagen(producto_id);

-- Ventas
CREATE INDEX idx_venta_paciente ON venta(paciente_id);
CREATE INDEX idx_venta_admin ON venta(admin_id);
CREATE INDEX idx_venta_estado ON venta(estado);
CREATE INDEX idx_venta_created_at ON venta(created_at);

-- Venta items
CREATE INDEX idx_venta_item_venta ON venta_item(venta_id);
CREATE INDEX idx_venta_item_producto ON venta_item(producto_id);

-- Movimientos de stock
CREATE INDEX idx_movimiento_stock_producto ON movimiento_stock(producto_id);
CREATE INDEX idx_movimiento_stock_created_at ON movimiento_stock(created_at);

-- Pedidos
CREATE INDEX idx_pedido_proveedor ON pedido(proveedor_id);
CREATE INDEX idx_pedido_estado ON pedido(estado);
CREATE INDEX idx_pedido_item_pedido ON pedido_item(pedido_id);

-- Reglas de descuento
CREATE INDEX idx_regla_descuento_nivel ON regla_descuento(nivel);
CREATE INDEX idx_regla_descuento_activo ON regla_descuento(activo) WHERE activo = true;

-- Tipo de cambio
CREATE INDEX idx_tipo_cambio_fecha ON tipo_cambio(fecha DESC);

-- Alertas de stock
CREATE INDEX idx_alerta_stock_producto ON alerta_stock(producto_id);
CREATE INDEX idx_alerta_stock_notificado ON alerta_stock(notificado) WHERE notificado = false;

-- Reserva temporal de stock
CREATE INDEX idx_reserva_stock_expira ON reserva_stock_temporal(expira_at) WHERE liberada = false;
CREATE INDEX idx_reserva_stock_venta ON reserva_stock_temporal(venta_id);

-- Encuestas
CREATE INDEX idx_encuesta_paciente ON encuesta(paciente_id);
-- FIX #10: Eliminado idx_encuesta_token (redundante con UNIQUE constraint)
CREATE INDEX idx_encuesta_aprobada ON encuesta(aprobada_para_publica) WHERE aprobada_para_publica = true;

-- Recordatorios de revisión
CREATE INDEX idx_recordatorio_fecha ON recordatorio_revision(fecha_revision) WHERE cancelado = false;
CREATE INDEX idx_recordatorio_paciente ON recordatorio_revision(paciente_id);

-- Cumpleaños
CREATE INDEX idx_cumpleanos_paciente_anio ON cumpleanos_email(paciente_id, anio);
-- FIX #21: Índice para descuentos no usados por vencer
CREATE INDEX idx_cumpleanos_valido_hasta ON cumpleanos_email(valido_hasta) WHERE usado = false;

-- Notificaciones programadas
-- FIX #22: Índice compuesto optimizado para el job de notificaciones
CREATE INDEX idx_notificacion_pendiente_programada
  ON notificacion_programada(programada_para)
  WHERE estado = 'PENDIENTE';
CREATE INDEX idx_notificacion_paciente ON notificacion_programada(paciente_id);

-- Email log
CREATE INDEX idx_email_log_paciente ON email_log(paciente_id);
CREATE INDEX idx_email_log_tipo ON email_log(tipo);
CREATE INDEX idx_email_log_created_at ON email_log(created_at);

-- Sesiones anónimas
CREATE INDEX idx_sesion_anonima_paciente ON sesion_anonima(paciente_id) WHERE paciente_id IS NOT NULL;
CREATE INDEX idx_sesion_anonima_fingerprint ON sesion_anonima(fingerprint) WHERE fingerprint IS NOT NULL;

-- Auditoría
CREATE INDEX idx_auditoria_admin ON auditoria(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla_afectada);
CREATE INDEX idx_auditoria_created_at ON auditoria(created_at);

-- FIX #20: Eliminado idx_metrica_cache_clave (redundante con UNIQUE constraint)

-- Webhook Alibaba
CREATE INDEX idx_webhook_alibaba_procesado ON webhook_alibaba_log(procesado) WHERE procesado = false;

-- Login attempts
CREATE INDEX idx_login_attempt_ip ON login_attempt(ip_address, created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en TODAS las tablas
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE horario_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_cita ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueo ENABLE ROW LEVEL SECURITY;
ALTER TABLE paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesion_anonima ENABLE ROW LEVEL SECURITY;
ALTER TABLE cita ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_imagen ENABLE ROW LEVEL SECURITY;
ALTER TABLE regla_descuento ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_cambio ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerta_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserva_stock_temporal ENABLE ROW LEVEL SECURITY;
ALTER TABLE encuesta ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordatorio_revision ENABLE ROW LEVEL SECURITY;
ALTER TABLE cumpleanos_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacion_programada ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_alibaba_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrica_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempt ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Funciones helper para RLS
-- ============================================

-- Verificar si el usuario es admin (cualquier rol)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin
    WHERE auth_user_id = auth.uid()
    AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FIX #17: Verificar si el usuario es dueño (para operaciones sensibles)
CREATE OR REPLACE FUNCTION is_dueno()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin
    WHERE auth_user_id = auth.uid()
    AND activo = true
    AND rol = 'DUENO'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- === ADMIN ===
CREATE POLICY admin_select ON admin
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY admin_update ON admin
  FOR UPDATE USING (auth_user_id = auth.uid());

-- === CONFIGURACIÓN ===
-- Solo dueño puede modificar configuración
CREATE POLICY configuracion_dueno_all ON configuracion
  FOR ALL USING (is_dueno()); -- FIX #17: Solo dueño

CREATE POLICY configuracion_public_read ON configuracion
  FOR SELECT USING (true); -- datos públicos: nombre, horario, dirección

-- === HORARIO SEMANAL ===
CREATE POLICY horario_admin_all ON horario_semanal
  FOR ALL USING (is_admin());

CREATE POLICY horario_public_read ON horario_semanal
  FOR SELECT USING (true);

-- === TIPO CITA ===
CREATE POLICY tipo_cita_admin_all ON tipo_cita
  FOR ALL USING (is_admin());

CREATE POLICY tipo_cita_public_read ON tipo_cita
  FOR SELECT USING (true);

-- === BLOQUEOS ===
CREATE POLICY bloqueo_admin_all ON bloqueo
  FOR ALL USING (is_admin());

CREATE POLICY bloqueo_public_read ON bloqueo
  FOR SELECT USING (true);

-- === PACIENTES ===
CREATE POLICY paciente_admin_all ON paciente
  FOR ALL USING (is_admin());
-- Flujo de reserva pública maneja pacientes vía Edge Functions con service_role

-- === SESIONES ANÓNIMAS ===
CREATE POLICY sesion_anonima_admin_select ON sesion_anonima
  FOR SELECT USING (is_admin());
-- Insert vía Edge Functions (service_role bypasea RLS)

-- === CITAS ===
CREATE POLICY cita_admin_all ON cita
  FOR ALL USING (is_admin());
-- FIX #2: Eliminada política pública permisiva USING(true).
-- El acceso público a citas por token se maneja vía Edge Functions con service_role,
-- que bypasea RLS. Esto evita exponer TODAS las citas a usuarios anónimos.

-- === LISTA DE ESPERA ===
CREATE POLICY lista_espera_admin_all ON lista_espera
  FOR ALL USING (is_admin());

-- === RECETAS ===
CREATE POLICY receta_admin_all ON receta
  FOR ALL USING (is_admin());

-- === PROVEEDORES ===
CREATE POLICY proveedor_admin_all ON proveedor
  FOR ALL USING (is_admin());

-- === CATEGORÍAS ===
CREATE POLICY categoria_admin_all ON categoria
  FOR ALL USING (is_admin());

-- === PRODUCTOS ===
CREATE POLICY producto_admin_all ON producto
  FOR ALL USING (is_admin());

-- === PRODUCTO IMÁGENES ===
CREATE POLICY producto_imagen_admin_all ON producto_imagen
  FOR ALL USING (is_admin());

-- === REGLAS DE DESCUENTO ===
CREATE POLICY regla_descuento_admin_all ON regla_descuento
  FOR ALL USING (is_admin());

-- === VENTAS ===
CREATE POLICY venta_admin_all ON venta
  FOR ALL USING (is_admin());

-- === VENTA ITEMS ===
CREATE POLICY venta_item_admin_all ON venta_item
  FOR ALL USING (is_admin());

-- === MOVIMIENTOS DE STOCK ===
CREATE POLICY movimiento_stock_admin_all ON movimiento_stock
  FOR ALL USING (is_admin());

-- === PEDIDOS ===
CREATE POLICY pedido_admin_all ON pedido
  FOR ALL USING (is_admin());

CREATE POLICY pedido_item_admin_all ON pedido_item
  FOR ALL USING (is_admin());

-- === TIPO DE CAMBIO ===
CREATE POLICY tipo_cambio_admin_all ON tipo_cambio
  FOR ALL USING (is_admin());

-- === ALERTAS DE STOCK ===
CREATE POLICY alerta_stock_admin_all ON alerta_stock
  FOR ALL USING (is_admin());

-- === RESERVA STOCK TEMPORAL ===
CREATE POLICY reserva_stock_temporal_admin_all ON reserva_stock_temporal
  FOR ALL USING (is_admin());

-- === ENCUESTAS ===
CREATE POLICY encuesta_admin_all ON encuesta
  FOR ALL USING (is_admin());
-- FIX #3: Eliminadas políticas públicas permisivas para encuestas.
-- Responder encuestas se maneja vía Edge Functions con service_role.

-- === RECORDATORIO REVISIÓN ===
CREATE POLICY recordatorio_revision_admin_all ON recordatorio_revision
  FOR ALL USING (is_admin());

-- === CUMPLEAÑOS EMAIL ===
CREATE POLICY cumpleanos_email_admin_all ON cumpleanos_email
  FOR ALL USING (is_admin());

-- === NOTIFICACIONES PROGRAMADAS ===
CREATE POLICY notificacion_programada_admin_all ON notificacion_programada
  FOR ALL USING (is_admin());

-- === EMAIL LOG ===
CREATE POLICY email_log_admin_all ON email_log
  FOR ALL USING (is_admin());

-- === WEBHOOK ALIBABA ===
CREATE POLICY webhook_alibaba_admin_all ON webhook_alibaba_log
  FOR ALL USING (is_admin());

-- === MÉTRICA CACHÉ ===
CREATE POLICY metrica_cache_admin_all ON metrica_cache
  FOR ALL USING (is_admin());

-- === AUDITORÍA ===
-- Solo dueño puede ver auditoría
CREATE POLICY auditoria_dueno_select ON auditoria
  FOR SELECT USING (is_dueno()); -- FIX #17: Solo dueño
-- Insert vía triggers/Edge Functions (service_role)

-- === LOGIN ATTEMPTS ===
CREATE POLICY login_attempt_admin_select ON login_attempt
  FOR SELECT USING (is_admin());
-- Insert vía Edge Functions (service_role)
