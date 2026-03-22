# Pendientes — Sistema de Gestión Óptica

---

## Completado

- [x] **Panel Admin completo** — Dashboard, Agenda, Pacientes, Recetas, Ventas/Caja, Inventario, Pedidos, Precios, Lista de espera, Encuestas, Reportes, Configuración
- [x] **Modo oscuro** — Toggle con persistencia + tokens CSS
- [x] **Responsive / Mobile** — Sidebar hamburger, grids adaptativos
- [x] **Impresión** — Recetas y comprobantes de venta con @media print
- [x] **Ficha paciente completa** — Historial de citas, recetas y compras
- [x] **Portal público** — Landing premium con estrategia de marketing, reserva de citas con verificación email, gestión de cita por token, encuesta post-cita
- [x] **11 Edge Functions** — get-availability, book-appointment, verify-appointment, manage-appointment, submit-survey, exchange-rate-daily, reminder-24h, retention-sequence, survey-post-appointment, annual-reminder, birthday-email, stock-alerts
- [x] **Emails con Resend** — Verificación, confirmación, recordatorio 24h, retención, encuesta, revisión anual, cumpleaños, alertas stock
- [x] **8 pg_cron jobs** — Tipo cambio, limpieza PRE_RESERVA, recordatorio 24h, retención, encuesta post-cita, revisión anual, cumpleaños, alertas stock

## Pendiente — Backend

- [ ] **Notificaciones por WhatsApp** — Integración con Twilio desde Edge Functions.
- [ ] **Rate limiting** — En Edge Functions públicas.

## Pendiente — Frontend

- [ ] **Deploy a producción** — Configurar dominio, SSL, variables de entorno.

## Pendiente — Seguridad (requiere dominio)

- [ ] **reCAPTCHA v3** — En formulario público de reservas. Requiere dominio registrado en Google reCAPTCHA.
- [ ] **Dominio propio en Resend** — Para enviar emails a cualquier cliente (no solo a emails verificados).
- [ ] **Auditoría** — Registrar acciones importantes en tabla `auditoria`.

---

*Última actualización: 2026-03-22*
