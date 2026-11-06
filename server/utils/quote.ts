import type { CartItem, Quote, QuoteLine } from '~~/types/store'

const FREE_SHIPPING_FROM_CENTS = 10000
const SHIPPING_CENTS = 800
const MAX_CART_LINES = 50

/** Rejects anything that isn't a list of { slug, quantity } before it reaches the database. */
export function parseCartItems(input: unknown): CartItem[] {
  if (
    !Array.isArray(input) ||
    input.length > MAX_CART_LINES ||
    !input.every(
      (i) => typeof i?.slug === 'string' && Number.isInteger(i?.quantity) && i.quantity > 0,
    )
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid cart items' })
  }
  return input.map((i) => ({ slug: i.slug, quantity: i.quantity }))
}

/**
 * Prices the cart from the database so the client's numbers are never trusted.
 * Products that no longer exist or are sold out are dropped, and quantities are capped to stock.
 */
export function buildQuote(items: CartItem[]): Quote {
  const lines: QuoteLine[] = []
  for (const item of items) {
    const product = getProduct(item.slug)
    if (!product || product.stock === 0) continue
    const quantity = Math.min(item.quantity, product.stock)
    lines.push({
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      tagline: product.tagline,
      priceCents: product.priceCents,
      stock: product.stock,
      categorySlug: product.categorySlug,
      categoryName: product.categoryName,
      image: product.image,
      imageAlt: product.imageAlt,
      quantity,
      lineTotalCents: quantity * product.priceCents,
    })
  }
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0)
  const shippingCents = subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING_CENTS
  return { lines, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents }
}
