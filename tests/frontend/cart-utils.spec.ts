import { expect, test } from '@playwright/test'
import { MAX_CART_LINES, normalizeCart } from '../../utils/cart'

test.describe('normalizeCart', () => {
  test('combines duplicate products, keeping their first position', () => {
    expect(
      normalizeCart([
        { slug: 'a', quantity: 1 },
        { slug: 'b', quantity: 2 },
        { slug: 'a', quantity: 3 },
      ]),
    ).toEqual([
      { slug: 'a', quantity: 4 },
      { slug: 'b', quantity: 2 },
    ])
  })

  test('drops invalid entries', () => {
    const invalid = [0, -1, 1.5, '1', null, Number.NaN, Number.MAX_SAFE_INTEGER + 1].map((quantity) => ({
      slug: 'a',
      quantity,
    }))
    expect(normalizeCart([...invalid, null, 'x', { quantity: 1 }, { slug: '', quantity: 1 }])).toEqual([])
  })

  test('returns an empty cart for anything but a list', () => {
    for (const input of [null, undefined, {}, 'cart', 3]) expect(normalizeCart(input)).toEqual([])
  })

  test('keeps to the line limit but still combines existing products', () => {
    const lines = Array.from({ length: MAX_CART_LINES + 5 }, (_, i) => ({ slug: `p${i}`, quantity: 1 }))
    const cart = normalizeCart([...lines, { slug: 'p0', quantity: 1 }])
    expect(cart).toHaveLength(MAX_CART_LINES)
    expect(cart[0]).toEqual({ slug: 'p0', quantity: 2 })
  })
})
