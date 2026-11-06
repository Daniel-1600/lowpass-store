import { randomBytes } from 'node:crypto'
import type { OrderConfirmation } from '~~/types/store'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mock checkout: validates and re-prices the order but takes no payment and stores nothing.
export default defineEventHandler(async (event): Promise<OrderConfirmation> => {
  const body = await readBody<{ items?: unknown; name?: unknown; email?: unknown; address?: unknown }>(event)
  const { name, email, address } = body ?? {}
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof address !== 'string' || !address.trim() ||
    typeof email !== 'string' || !EMAIL.test(email)
  ) {
    throw createError({ statusCode: 422, statusMessage: 'Please provide a name, a valid email and an address' })
  }

  const quote = buildQuote(parseCartItems(body.items))
  if (!quote.lines.length) {
    throw createError({ statusCode: 409, statusMessage: 'Your cart has no items available to buy' })
  }

  return {
    orderNumber: `LP-${randomBytes(4).toString('hex').toUpperCase()}`,
    email,
    totalCents: quote.totalCents,
  }
})
