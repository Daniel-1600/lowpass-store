import type { CartItem } from '../types/store'

/** Matches MAX_CART_LINES in backend/quote.py, which rejects longer carts. */
export const MAX_CART_LINES = 50

/** Turns untrusted input into a valid cart: one line per product, whole positive quantities. */
export function normalizeCart(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return []
  const quantities = new Map<string, number>()
  for (const entry of input) {
    const { slug, quantity } = (entry ?? {}) as { slug?: unknown; quantity?: unknown }
    if (typeof slug !== 'string' || !slug || !Number.isSafeInteger(quantity) || (quantity as number) <= 0) continue
    if (!quantities.has(slug) && quantities.size >= MAX_CART_LINES) continue
    quantities.set(slug, Math.min((quantities.get(slug) ?? 0) + (quantity as number), Number.MAX_SAFE_INTEGER))
  }
  return [...quantities].map(([slug, quantity]) => ({ slug, quantity }))
}
