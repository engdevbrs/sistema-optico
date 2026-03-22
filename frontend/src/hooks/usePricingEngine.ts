import type { Product } from '../types/product'
import type { DiscountRule } from '../types/sale'

/**
 * Calcula el precio de venta de un producto usando la jerarquía de 4 niveles:
 * 1. precio_venta_fijo (máxima prioridad)
 * 2. producto.multiplicador × precio_compra_clp
 * 3. categoria.multiplicador × precio_compra_clp
 * 4. proveedor.multiplicador × precio_compra_clp
 */
export function calculateSalePrice(product: Product): number | null {
  if (product.precio_venta_fijo != null && product.precio_venta_fijo > 0) {
    return product.precio_venta_fijo
  }

  const precioCompra = product.precio_compra_clp
  if (precioCompra == null || precioCompra <= 0) return null

  if (product.multiplicador != null && product.multiplicador > 0) {
    return Math.round(precioCompra * product.multiplicador)
  }

  if (product.categoria?.multiplicador != null && product.categoria.multiplicador > 0) {
    return Math.round(precioCompra * product.categoria.multiplicador)
  }

  if (product.proveedor?.multiplicador != null && product.proveedor.multiplicador > 0) {
    return Math.round(precioCompra * product.proveedor.multiplicador)
  }

  return null
}

/**
 * Encuentra la regla de descuento más específica aplicable a un producto.
 * Prioridad: PRODUCTO > TEMPORAL > PROVEEDOR > CATEGORIA > GLOBAL
 */
export function findApplicableDiscount(
  product: Product,
  rules: DiscountRule[]
): DiscountRule | null {
  const today = new Date().toISOString().split('T')[0]
  const activeRules = rules.filter((r) => r.activo)

  // PRODUCTO — regla específica para este producto
  const productoRule = activeRules.find(
    (r) => r.nivel === 'PRODUCTO' && r.producto_id === product.id
  )
  if (productoRule) return productoRule

  // TEMPORAL — vigente por fecha
  const temporalRule = activeRules.find(
    (r) =>
      r.nivel === 'TEMPORAL' &&
      r.fecha_inicio != null &&
      r.fecha_fin != null &&
      r.fecha_inicio <= today &&
      r.fecha_fin >= today
  )
  if (temporalRule) return temporalRule

  // PROVEEDOR
  if (product.proveedor_id) {
    const proveedorRule = activeRules.find(
      (r) => r.nivel === 'PROVEEDOR' && r.proveedor_id === product.proveedor_id
    )
    if (proveedorRule) return proveedorRule
  }

  // CATEGORIA
  const categoriaRule = activeRules.find(
    (r) => r.nivel === 'CATEGORIA' && r.categoria_id === product.categoria_id
  )
  if (categoriaRule) return categoriaRule

  // GLOBAL
  const globalRule = activeRules.find((r) => r.nivel === 'GLOBAL')
  if (globalRule) return globalRule

  return null
}

/**
 * Calcula los totales de un item del carrito.
 */
export function calculateItemTotals(
  precioUnitario: number,
  cantidad: number,
  descuentoPorcentaje: number
): { descuento_monto: number; subtotal: number } {
  const bruto = precioUnitario * cantidad
  const descuento_monto = Math.round(bruto * descuentoPorcentaje / 100)
  const subtotal = bruto - descuento_monto
  return { descuento_monto, subtotal }
}

/**
 * Calcula los totales de toda la venta a partir del carrito.
 */
export function calculateCartTotals(items: { precio_unitario: number; cantidad: number; descuento_monto: number; subtotal: number }[]) {
  const subtotal = items.reduce((acc, item) => acc + item.precio_unitario * item.cantidad, 0)
  const descuento_total = items.reduce((acc, item) => acc + item.descuento_monto, 0)
  const total = items.reduce((acc, item) => acc + item.subtotal, 0)
  const { neto, iva } = calculateIVA(total)
  return { subtotal, descuento_total, total, neto, iva }
}

const IVA_RATE = 0.19

/**
 * Desglose de IVA (19%) a partir del precio con IVA incluido.
 * neto + iva = totalConIva
 */
export function calculateIVA(totalConIva: number): { neto: number; iva: number } {
  const neto = Math.round(totalConIva / (1 + IVA_RATE))
  const iva = totalConIva - neto
  return { neto, iva }
}
