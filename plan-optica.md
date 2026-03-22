# Sistema de Gestión Óptica
### Plan Completo de Desarrollo — v1.0 | Marzo 2026

---

## Índice
1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Tipos de Usuario](#3-tipos-de-usuario)
4. [Mapa del Sistema](#4-mapa-del-sistema)
5. [Módulos del Sistema](#5-módulos-del-sistema)
6. [Inventario](#6-módulo-de-inventario)
7. [Retención y Marketing](#7-retención-y-marketing-automático)
8. [Notificaciones](#8-sistema-de-notificaciones)
9. [Seguridad](#9-seguridad-y-protecciones)
10. [Fallos Cubiertos](#10-fallos-cubiertos-por-el-sistema)
11. [Schema de Base de Datos](#11-schema-de-base-de-datos)
12. [Plan de Fases](#12-plan-de-desarrollo-por-fases)
13. [Flujo General del Negocio](#13-flujo-general-del-negocio)
14. [Configuración Inicial](#14-configuración-inicial-del-sistema)

---

## 1. Resumen Ejecutivo

El sistema de gestión para la óptica es una plataforma web completa que integra la gestión de citas, pacientes, inventario, ventas y marketing de retención en un único panel administrativo. Está diseñado para operar desde el primer día con un solo usuario (el dueño), con capacidad de escalar hacia empleados en el futuro sin reescribir el código.

### Principios de diseño

- **Simple para el cliente:** reserva sin cuenta, solo email y teléfono
- **Completo para el admin:** control total del negocio desde un panel
- **Alibaba-ready:** inventario diseñado para integración futura
- **Retención automática:** el sistema trabaja solo para traer clientes de vuelta
- **Seguro por diseño:** protecciones a nivel de código y base de datos

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | React + TypeScript + Tailwind CSS | Componentes reutilizables, tipado seguro, UI rápida |
| Estado del servidor | React Query | Manejo de citas, pacientes y stock en tiempo real |
| Backend | Node.js + Express | API REST simple y rápida |
| ORM | Prisma | Queries seguras, migraciones automáticas |
| Base de datos | PostgreSQL | Relacional, ideal para este dominio |
| Autenticación | JWT + bcrypt | Sesiones seguras para el admin |
| Emails | Resend | Envío confiable con analytics |
| WhatsApp | Twilio | Notificaciones con alta tasa de apertura |
| PDF | PDFKit | Recetas y comprobantes imprimibles |
| Jobs programados | Trigger.dev | Recordatorios, retención y alertas automáticas |
| Imágenes / Storage | Supabase Storage | Almacenamiento de imágenes de productos |
| Infraestructura | Railway + Supabase | Deploy sencillo, base de datos gestionada |
| Tipo de cambio | ExchangeRate API | USD a CLP automático diario |
| Alibaba (futuro) | Alibaba Open Platform | Integración de pedidos y stock |
| Anti-bots | Google reCAPTCHA v3 | Protección del formulario de reservas |
| Fingerprint | FingerprintJS | Identificación de clientes sin cuenta |

---

## 3. Tipos de Usuario

### 🙋 Cliente (sin cuenta)

El cliente **no necesita crear una cuenta**. Accede al sistema mediante un link único generado al momento de reservar, enviado por email o WhatsApp.

**Acciones disponibles:**
- Reservar una cita (nombre + email/teléfono)
- Confirmar su cita desde el link recibido
- Editar fecha u hora de su cita
- Cancelar su cita
- Unirse a lista de espera si no hay disponibilidad
- Responder encuesta post-cita

### 🔐 Admin / Dueño (con cuenta)

Login tradicional con email y contraseña. Acceso completo a todas las funcionalidades del sistema. Por ahora es el único rol activo.

> 💡 El schema incluye el campo `rol` en la tabla `Admin` (DUEÑO | VENDEDOR) para cuando se contrate personal en el futuro. La arquitectura está lista para escalar sin reescribir código.

---

## 4. Mapa del Sistema

### Portal del Cliente (público, sin autenticación)

| Ruta | Descripción |
|---|---|
| `/` | Página pública de la óptica con disponibilidad en tiempo real |
| `/reservar` | Formulario de nueva cita |
| `/cita/:token` | Ver, editar o cancelar la cita del cliente |

### Panel Admin (privado, requiere login)

| Ruta | Descripción |
|---|---|
| `/admin/login` | Autenticación del admin |
| `/admin/dashboard` | Resumen del día, semana y alertas |
| `/admin/agenda` | Vista calendario día / semana / mes |
| `/admin/pacientes` | Lista completa con búsqueda |
| `/admin/pacientes/:id` | Ficha completa, historial, recetas, compras |
| `/admin/recetas/nueva` | Crear receta óptica |
| `/admin/recetas/:id` | Ver e imprimir receta en PDF |
| `/admin/ventas/nueva` | Registrar nueva venta |
| `/admin/ventas/:id` | Detalle de venta y comprobante |
| `/admin/inventario` | Lista de productos con stock y semáforo |
| `/admin/inventario/:id` | Ficha de producto, historial de movimientos |
| `/admin/pedidos` | Pedidos a proveedores activos y pasados |
| `/admin/pedidos/nuevo` | Crear pedido a proveedor |
| `/admin/lista-espera` | Clientes esperando disponibilidad |
| `/admin/precios/descuentos` | Gestión de reglas de descuento |
| `/admin/precios/multiplicadores` | Multiplicadores por categoría y proveedor |
| `/admin/precios/rentabilidad` | Vista de margen por producto |
| `/admin/encuestas` | Respuestas, calificaciones y alertas |
| `/admin/reportes` | Ventas, inventario y pacientes exportables |
| `/admin/configuracion` | Datos de la óptica, horarios, límites |

---

## 5. Módulos del Sistema

### 5.1 Horarios de Atención y Bloqueos

El admin configura cuándo puede atender. El portal de reservas solo muestra slots disponibles calculados en tiempo real.

**Configuración disponible:**
- Horario semanal por día (activo/inactivo, hora inicio y fin)
- Tipos de cita con duración propia (Consulta 45min, Control 20min, Examen 60min)
- Bloqueos por fecha: feriados, vacaciones, capacitaciones
- Límite de citas por día configurable

> El sistema usa el criterio más restrictivo entre el horario semanal, los bloqueos y el límite diario para calcular la disponibilidad real.

---

### 5.2 Portal de Reservas del Cliente

**Flujo de reserva:**
1. Cliente ingresa nombre, email, teléfono y elige tipo de cita
2. Sistema envía código de verificación de 6 dígitos al email
3. Sin verificación, la reserva queda en `PRE_RESERVA` y expira en 15 minutos
4. Al verificar, la cita pasa a `PENDIENTE` y se envía el link único de gestión
5. Cliente puede confirmar, editar o cancelar desde ese link

**Estados de una cita:**

| Estado | Descripción |
|---|---|
| `PRE_RESERVA` | Recién creada, esperando verificación de email (expira en 15 min) |
| `PENDIENTE` | Verificada, esperando confirmación activa del cliente |
| `CONFIRMADA` | Cliente confirmó activamente su asistencia |
| `COMPLETADA` | Admin la marcó como realizada |
| `CANCELADA` | Cliente o admin la canceló |
| `NO_ASISTIÓ` | Admin la marcó porque el cliente no llegó |

---

### 5.3 Lista de Espera

- Si no hay disponibilidad, cliente puede anotarse en lista de espera
- Al cancelarse una cita, el primero de la lista recibe notificación
- Tiene 24 horas para confirmar antes de que se notifique al siguiente
- Si ya reservó por otro medio, el sistema detecta la cita activa y pregunta
- Si no interactúa en 48h, se elimina de la lista automáticamente

---

### 5.4 Secuencia de Retención por Cancelación

Cuando un cliente cancela, el sistema activa una secuencia automática de emails para recuperarlo. La secuencia se cancela si el cliente vuelve a reservar.

| Momento | Acción | Contenido |
|---|---|---|
| Al cancelar | Email inmediato | Acuse de cancelación + botón para volver a reservar |
| 3 días después | Email de seguimiento | Mensaje de preocupación + slot sugerido disponible |
| 7 días después | Último email | Recordatorio sobre la importancia de la salud visual |

> Al cancelar, el sistema pregunta el motivo: Cambio de planes / Me queda lejos / Precio / Otro. Esta información aparece en el dashboard del admin.

---

### 5.5 Gestión de Pacientes

**Ficha completa del paciente incluye:**
- Datos personales (nombre, email, teléfono, fecha de nacimiento)
- Historial completo de citas con estados
- Historial de recetas ópticas con comparativa entre visitas
- Historial de compras con productos y montos
- Próxima revisión programada
- Preferencia de contacto (email / WhatsApp / ambos)
- Contador de cancelaciones del mes

> Solo el admin puede modificar datos sensibles como la fecha de nacimiento, para evitar abusos en el descuento de cumpleaños.

---

### 5.6 Recetas Ópticas

- Creadas por el admin durante o después de la consulta
- Incluyen datos de ambos ojos: esfera, cilindro, eje, adición, agudeza visual
- Distancia pupilar y observaciones libres
- Fecha de próxima revisión (activa recordatorio automático)
- Generación de PDF imprimible con logo y datos de la óptica
- No se pueden eliminar (documentos médicos). Los errores se corrigen creando una receta de reemplazo

---

### 5.7 Módulo de Ventas / Caja

El admin realiza todas las ventas directamente desde el panel. El flujo tiene 7 pasos obligatorios:

| Paso | Acción | Notas |
|---|---|---|
| 1 | Identificar al cliente | Buscar en el sistema o crear nuevo |
| 2 | Verificar identidad | Presencial / Familiar autorizado / Comprobante |
| 3 | Agregar productos | Stock en tiempo real, precio definido por admin |
| 4 | Asociar receta (opcional) | Obligatorio si vende lentes (con opción de omitir con motivo) |
| 5 | Aplicar descuento | Solo predefinidos por el admin |
| 6 | Confirmar pago | Efectivo (con calculadora de vuelto), débito, crédito, transferencia |
| 7 | Generar comprobante | PDF con imagen del producto, imprimible o por email/WhatsApp |

> Los precios siempre vienen del sistema. El admin los define, el sistema los muestra, y en la venta solo se cobra el precio calculado. No hay edición manual de precios en el momento de la venta.

---

## 6. Módulo de Inventario

### 6.1 Productos

- Categorías: Armazones / Monturas y Accesorios (estuches, limpiadores)
- Imagen extraída automáticamente desde la URL de Alibaba
- Imagen guardada en Supabase Storage (copia propia, no depende de Alibaba)
- Thumbnail 200×200px generado automáticamente para listas
- Si la extracción automática falla: opción de subir imagen manualmente

---

### 6.2 Motor de Precios

Jerarquía de precios — el sistema siempre sabe cuál regla aplicar:

| Prioridad | Tipo | Descripción |
|---|---|---|
| 1 (mayor) | Precio fijo manual | Admin ingresa el precio directamente |
| 2 | Multiplicador propio | `precio_compra × multiplicador` del producto |
| 3 | Multiplicador de categoría | `precio_compra × multiplicador` de la categoría |
| 4 (menor) | Multiplicador de proveedor | `precio_compra × multiplicador` del proveedor |

**Jerarquía de descuentos (de menor a mayor especificidad):**
- Global: aplica a todos los productos
- Por categoría: todos los armazones o todos los accesorios
- Por proveedor: todos los productos de ese proveedor
- Por producto: un producto específico
- Temporales: con fecha de inicio y fin

> El comportamiento al acumular descuentos es configurable: Solo el más específico / Acumulados / Acumulados con tope máximo.

---

### 6.3 Tipo de Cambio USD/CLP

- El precio de compra se registra en USD (moneda de Alibaba)
- El sistema convierte a CLP automáticamente con el tipo de cambio del día
- Actualización automática diaria vía ExchangeRate API (gratis)
- Si el tipo de cambio varía más del 5%, el admin recibe alerta para revisar precios

---

### 6.4 Alertas de Stock

| Nivel | Semáforo | Frecuencia del email al admin |
|---|---|---|
| Stock medio (cruzó umbral medio) | 🟡 Amarillo | Una vez al día mientras se mantenga bajo el umbral |
| Stock bajo (cruzó umbral mínimo) | 🔴 Rojo | Una vez al día mientras se mantenga bajo el umbral |
| Stock agotado (llegó a 0) | ⛔ Negro | Una vez al día hasta que se reponga |

**Cada email de alerta incluye:**
- Imagen del producto
- Nombre del proveedor
- Link directo al producto en Alibaba (con aviso si el link tiene más de 6 meses)
- Botones de acción directa

> Los umbrales son configurables por producto. Se puede usar cantidad fija, porcentaje del stock óptimo, o ambos criterios (el más conservador gana).

---

### 6.5 Arquitectura Alibaba-Ready

El inventario está diseñado para integrarse con la API de Alibaba sin reescribir nada. Hoy funciona en modo manual; cuando la cuenta esté activa, solo se activa el adaptador real.

- `alibaba_product_url`: link directo al producto (ya existe en el schema)
- `alibaba_order_id`: ID del pedido en Alibaba (se llena cuando se integre)
- `origen` en `Movimiento_Stock`: `MANUAL` o `ALIBABA_API`
- Webhooks de Alibaba: la llegada de un pedido notifica al admin para confirmar ingreso físico

---

## 7. Retención y Marketing Automático

### 7.1 Recordatorio de Revisión Anual

- La receta óptica incluye fecha de próxima revisión
- Job diario busca pacientes con revisión en 30 días
- Email personalizado con botón directo al formulario de reserva
- Si no responde: recordatorio a los 15 días, luego a los 7 días antes
- Si el paciente reserva en cualquier punto, la secuencia se cancela automáticamente

---

### 7.2 Email de Cumpleaños

- Job diario busca pacientes cuyo cumpleaños es hoy
- Genera un descuento único automáticamente (ej: 15%, válido 30 días, uso único)
- Email personalizado con código de descuento
- Solo se envía una vez por año (protegido a nivel de DB con índice único)
- Solo el admin puede cambiar la fecha de nacimiento de un paciente

---

### 7.3 Encuesta Post-Cita

- Se envía 2 horas después de que el admin marca la cita como `COMPLETADA`
- Calificación de 1 a 5 estrellas con comentario opcional
- **4-5 estrellas:** se redirige a Google Reviews para aumentar reputación pública
- **1-3 estrellas:** el admin recibe alerta inmediata para gestionar la situación
- Las reseñas de 4-5 estrellas se publican en la página pública (con aprobación del admin)
- Token de encuesta de un solo uso: no se puede responder dos veces

---

### 7.4 Página Pública de la Óptica

- Disponibilidad de citas en tiempo real: cuando alguien cancela, el slot aparece de inmediato
- Calificación promedio de estrellas calculada desde las encuestas internas
- Últimas 3 reseñas aprobadas por el admin
- Datos de contacto, horarios y mapa embebido
- Botón de reserva directo sin fricciones

---

## 8. Sistema de Notificaciones

| Evento | Email | WhatsApp |
|---|---|---|
| Reserva creada (verificación) | ✅ | ❌ (solo email) |
| Cita confirmada | ✅ | ✅ |
| Recordatorio 24h antes | ✅ | ✅ |
| Cita cancelada | ✅ | ✅ |
| Retención 3 días | ✅ | ✅ |
| Retención 7 días | ✅ | ✅ |
| Lista de espera: slot disponible | ✅ | ✅ |
| Encuesta post-cita | ✅ | Opcional |
| Recordatorio revisión anual | ✅ | ✅ |
| Cumpleaños + descuento | ✅ | ✅ |
| Alerta stock bajo (al admin) | ✅ | Opcional |
| Pedido Alibaba en camino (al admin) | ✅ | Opcional |

**Protecciones:**
- Cola de reintentos: si falla, reintenta en 5min, 30min y 2h
- Si falla 3 veces por email: intenta por WhatsApp como respaldo
- Admin ve panel de emails fallidos en el dashboard
- Si el cliente bloquea WhatsApp: sistema lo detecta y usa solo email
- Cada job verifica en el momento del envío si el cliente ya reservó (evita retención prematura)

---

## 9. Seguridad y Protecciones

### 9.1 Autenticación del Admin

- JWT con expiración de 4 horas
- Refresh token en `httpOnly` cookie (no accesible desde JavaScript)
- Máximo 5 intentos fallidos de login: bloqueo de 15 minutos por IP
- Email de alerta si hay más de 3 intentos fallidos
- Al cambiar contraseña, todas las sesiones activas se invalidan

---

### 9.2 Identificación de Clientes sin Cuenta

| Señal | Fuerza | Uso |
|---|---|---|
| Email verificado | 🔴 Fuerte | Identidad principal |
| Teléfono verificado | 🔴 Fuerte | Identidad secundaria |
| Fingerprint del dispositivo (FingerprintJS) | 🟡 Media | Detectar evasión |
| IP del cliente | 🟡 Débil | Referencial, no bloqueante |

> El sistema nunca bloquea solo por fingerprint o IP. Son señales de alerta para el admin, no bloqueos automáticos. Solo email + teléfono verificados generan restricciones reales.

---

### 9.3 Protecciones de Lógica de Negocio

- **Concurrencia:** transacciones con `FOR UPDATE` en la DB para evitar doble reserva
- **Stock negativo:** imposible por `CHECK (stock_actual >= 0)` en la DB
- **Inyección SQL:** Prisma ORM usa queries parametrizadas + validación con Zod
- **Tokens:** UUID v4, prácticamente imposibles de adivinar
- **reCAPTCHA v3** + rate limiting en el formulario de reservas
- **Soft delete:** nada se borra físicamente, todo se puede restaurar
- **Auditoría completa:** cada acción importante queda registrada con fecha, hora y quién la hizo

---

### 9.4 Protección de Datos Médicos

- Las recetas nunca se exponen en endpoints públicos
- PDFs de recetas con URL temporal firmada que expira en 1 hora
- Log de quién descargó cada PDF
- Backups automáticos diarios (Supabase) + backup semanal adicional

---

## 10. Fallos Cubiertos por el Sistema

| Área | Fallo | Solución |
|---|---|---|
| Reservas | Doble reserva simultánea | Transacción con `FOR UPDATE` en DB |
| Reservas | Email falso al reservar | Verificación con código de 6 dígitos, expira en 15min |
| Reservas | Cliente acapara slots | Máximo 1 cita activa por email/teléfono |
| Reservas | Múltiples cancelaciones | Límite de 2 cancelaciones por mes, se resetea el día 1 |
| Citas | Admin bloquea día con citas | Sistema alerta y ofrece cancelarlas con notificación |
| Citas | Duración de cita cambia | La duración se copia al crear la cita, no se recalcula |
| Ventas | Stock se agota a mitad de venta | Reserva temporal de stock por 15 minutos |
| Ventas | Venta abandonada por admin | Reserva temporal expira y stock se libera automáticamente |
| Ventas | Precio cambia durante la venta | Precio se congela al agregar al carrito |
| Inventario | Stock queda negativo | `CHECK` constraint en DB + validación en backend |
| Inventario | Pedido Alibaba duplicado | Idempotencia con ID único de webhook |
| Inventario | Cantidad recibida diferente | Confirmación de ingreso con cantidades editables |
| Recetas | Receta para paciente equivocado | No se puede eliminar, se crea receta de reemplazo |
| Precios | Descuento excesivo por error | Límite máximo configurable + confirmación extra |
| Cumpleaños | Cliente cambia fecha para descuento | Solo admin edita fecha, 1 descuento por año |
| Seguridad | Fuerza bruta en login | 5 intentos máximos + bloqueo 15min por IP |
| Seguridad | Token de cita adivinado | UUID v4, expira 24h después de la cita |
| Emails | Email rebota o va a spam | SPF + DKIM + DMARC + reintentos automáticos |
| Reportes | Ventas anuladas como ingresos | Filtro estricto por estado `COMPLETADA` |
| Reportes | Dashboard lento | Caché de métricas históricas, tiempo real solo para hoy |
| WhatsApp | Cliente bloquea el número | Twilio notifica, sistema cambia a solo email |
| Alibaba | API cambia sin aviso | Patrón Adapter aísla el cambio, tests diarios |
| Alibaba | Estado desconocido en pedido | Mapeo exhaustivo + alerta al admin si es desconocido |
| UX | Email mal escrito al reservar | Detección de typos (@gmai.com → @gmail.com) |
| UX | Link de cita expirado | Link de gestión es permanente hasta 24h después de la cita |
| Admin | Borrado accidental de paciente | Soft delete + período de gracia de 30 días para restaurar |
| Admin | Precio histórico incorrecto | `Venta_Item` guarda el precio al momento exacto de vender |

---

## 11. Schema de Base de Datos

### Tablas principales

| Tabla | Descripción | Relaciones clave |
|---|---|---|
| `Admin` | Dueño del sistema (y futuros empleados) | — |
| `Configuracion` | Datos de la óptica, horarios, límites, moneda | Admin |
| `Horario_Semanal` | Horario de atención por día de la semana | Admin |
| `Tipo_Cita` | Tipos de consulta con duración propia | — |
| `Bloqueo` | Días o rangos bloqueados (feriados, vacaciones) | Admin |
| `Paciente` | Clientes de la óptica | — |
| `Sesion_Anonima` | Fingerprint e IP por visita del cliente | Paciente |
| `Cita` | Reservas de los pacientes | Paciente, Tipo_Cita |
| `Lista_Espera` | Clientes esperando disponibilidad | Paciente |
| `Receta` | Prescripciones ópticas | Paciente, Cita |
| `Venta` | Transacciones de venta | Paciente, Receta, Admin |
| `Venta_Item` | Productos de cada venta (con precio snapshot) | Venta, Producto |
| `Categoria` | Categorías de productos con multiplicador | — |
| `Proveedor` | Proveedores (Alibaba) con multiplicador | — |
| `Producto` | Armazones y accesorios | Categoria, Proveedor |
| `Producto_Imagen` | Imágenes extraídas de Alibaba | Producto |
| `Movimiento_Stock` | Historial de cada cambio de stock | Producto, Pedido, Venta |
| `Pedido` | Pedidos a proveedores | Proveedor |
| `Pedido_Item` | Productos de cada pedido | Pedido, Producto |
| `Regla_Descuento` | Reglas de descuento por nivel | Categoria, Proveedor, Producto |
| `Tipo_Cambio` | Historial de tipos de cambio USD/CLP | — |
| `Alerta_Stock` | Alertas generadas por stock bajo | Producto |
| `Reserva_Stock_Temporal` | Reserva de stock durante una venta en progreso | Producto |
| `Encuesta` | Respuestas post-cita | Paciente, Cita |
| `Recordatorio_Revision` | Control de recordatorios de revisión anual | Paciente, Receta |
| `Cumpleanos_Email` | Control de emails de cumpleaños por año | Paciente |
| `Notificacion_Programada` | Cola de emails de retención programados | Paciente, Cita |
| `Email_Log` | Trazabilidad de cada email enviado | Paciente |
| `Webhook_Alibaba_Log` | Registro de webhooks de Alibaba (idempotencia) | — |
| `Metrica_Cache` | Caché de métricas del dashboard | — |
| `Auditoria` | Log de todas las acciones importantes del sistema | Admin, Paciente |

---

## 12. Plan de Desarrollo por Fases

| Fase | Módulo | Prioridad |
|---|---|---|
| 1 | Schema DB completo + API base | 🔴 Crítico |
| 2 | Autenticación admin + configuración de la óptica | 🔴 Crítico |
| 3 | Horarios de atención + tipos de cita + bloqueos + límite diario | 🔴 Crítico |
| 4 | Portal de reserva del cliente + verificación de email + token único | 🔴 Crítico |
| 5 | Confirmación y cancelación de cita + secuencia de retención | 🔴 Crítico |
| 6 | Lista de espera automática | 🔴 Crítico |
| 7 | Agenda del admin (día / semana / mes) con estados en tiempo real | 🔴 Crítico |
| 8 | Ficha del paciente + historial completo | 🟡 Importante |
| 9 | Recetas ópticas + generación de PDF imprimible | 🟡 Importante |
| 10 | Módulo de ventas / caja (flujo de 7 pasos) | 🟡 Importante |
| 11 | Motor de precios: multiplicadores + jerarquía de descuentos | 🟡 Importante |
| 12 | Inventario: CRUD de productos + imágenes desde Alibaba | 🟡 Importante |
| 13 | Alertas de stock: niveles configurables + emails al admin | 🟡 Importante |
| 14 | Flujo de pedidos a proveedores + confirmación de ingreso | 🟡 Importante |
| 15 | Tipo de cambio USD/CLP automático | 🟡 Importante |
| 16 | Recordatorio de revisión anual automático | 🟡 Importante |
| 17 | Encuesta post-cita + filtro inteligente hacia Google Reviews | 🟡 Importante |
| 18 | Email de cumpleaños + descuento automático | 🟡 Importante |
| 19 | Página pública con disponibilidad en tiempo real | 🟡 Importante |
| 20 | Notificaciones por WhatsApp (Twilio) | 🟡 Importante |
| 21 | Integración con API de Alibaba (seguimiento de pedidos) | 🟡 Importante |
| 22 | Dashboard de métricas + reportes exportables (Excel/PDF) | 🟢 Nice to have |
| 23 | Roles y permisos para empleados (VENDEDOR) | 🟢 Nice to have |

---

## 13. Flujo General del Negocio

Este es el ciclo completo que vive un cliente desde que llega hasta que se convierte en un cliente recurrente.

1. Cliente descubre la óptica en la página pública (ve disponibilidad + reseñas reales)
2. Reserva una cita (nombre + email + teléfono + verificación)
3. Confirma su cita desde el link recibido por email/WhatsApp
4. Recibe recordatorio 24 horas antes
5. Asiste a la cita. Admin crea la receta óptica
6. Cliente compra armazones o accesorios. Venta registrada, stock descontado automáticamente
7. 2 horas después: recibe encuesta de satisfacción
8. 5 estrellas → se redirige a Google Reviews. Su reseña aparece en la página pública
9. En su cumpleaños: recibe descuento especial por email/WhatsApp
10. 30 días antes de su próxima revisión: recordatorio automático con botón de reserva
11. **Vuelve a reservar. El ciclo se repite. ♻️**

---

## 14. Configuración Inicial del Sistema

Antes de lanzar el sistema, el admin debe configurar:

| Configuración | Descripción | Obligatorio |
|---|---|---|
| Datos de la óptica | Nombre, logo, dirección, teléfono, email | ✅ Sí |
| Horario de atención | Días y horas por día de la semana | ✅ Sí |
| Tipos de cita | Nombre y duración de cada tipo | ✅ Sí |
| Límite de citas por día | Número máximo de citas diarias | ✅ Sí |
| Moneda local | CLP, USD, etc. | ✅ Sí |
| Tipo de cambio | Manual o automático (API) | ✅ Sí |
| Multiplicadores de precio | Por categoría y/o proveedor | ✅ Sí |
| Descuento máximo | Porcentaje máximo aplicable en ventas | ✅ Sí |
| Umbrales de stock | Stock medio y mínimo por categoría o producto | ✅ Sí |
| Proveedores | Nombre, URL de Alibaba, tiempo de entrega | 🟡 Recomendado |
| Descuentos predefinidos | Reglas de descuento disponibles para aplicar | 🟡 Recomendado |
| Preferencia de contacto | Email, WhatsApp o ambos por defecto | 🟡 Recomendado |

---

*Sistema de Gestión Óptica — Plan v1.0 — Marzo 2026*