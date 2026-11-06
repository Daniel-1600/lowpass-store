import { expect, test } from '@playwright/test'
import { expectOrderPlaced, fillCheckout, open, placeOrderButton, seedCart, storedCart } from './helpers'

test('places a reviewed order and only then clears the cart', async ({ page }) => {
  await seedCart(page, [{ slug: 'arc-one', quantity: 1 }])
  await open(page, '/checkout')
  await fillCheckout(page)

  await placeOrderButton(page).click()

  await expectOrderPlaced(page)
  await expect(page.getByText(/\$249\.00 receipt/)).toBeVisible()
  expect(await storedCart(page)).toEqual([])
})

test('requires confirmation when the cart can’t be sold as it is', async ({ page }) => {
  await seedCart(page, [
    { slug: 'arc-one', quantity: 99 },
    { slug: 'arc-studio', quantity: 1 },
  ])
  await open(page, '/checkout')
  await fillCheckout(page)

  await expect(page.getByRole('heading', { name: 'Your order has changed' })).toBeVisible()
  await expect(page.getByText('Arc Studio is sold out.')).toBeVisible()
  await expect(placeOrderButton(page)).toBeDisabled()
  expect(await storedCart(page)).toHaveLength(2)

  await page.getByRole('button', { name: 'Accept changes' }).click()

  await expect(page.getByRole('heading', { name: 'Your order has changed' })).toBeHidden()
  await expect(placeOrderButton(page)).toBeEnabled()
  expect(await storedCart(page)).toEqual([{ slug: 'arc-one', quantity: 18 }])

  await placeOrderButton(page).click()
  await expectOrderPlaced(page)
})

test('an order that changed after review is refused until the shopper accepts', async ({ page }) => {
  // The shopper reviews a quote that's out of date by the time they submit, so the real API refuses it.
  let firstQuote = true
  await page.route('**/api/cart/quote', async (route) => {
    const response = await route.fetch()
    const quote = await response.json()
    if (firstQuote) {
      firstQuote = false
      quote.fingerprint = 'out-of-date'
      quote.totalCents -= 1000
    }
    await route.fulfill({ response, json: quote })
  })
  await seedCart(page, [{ slug: 'arc-one', quantity: 1 }])
  await open(page, '/checkout')
  await fillCheckout(page)

  await placeOrderButton(page).click()

  await expect(page.getByRole('heading', { name: 'Your order has changed' })).toBeVisible()
  await expect(page.getByText('Your total went from $239.00 to $249.00.')).toBeVisible()
  await expect(placeOrderButton(page)).toBeDisabled()
  await expect(page.getByRole('heading', { name: 'Thanks, that’s all done.' })).toBeHidden()
  expect(await storedCart(page)).toEqual([{ slug: 'arc-one', quantity: 1 }])
  await expect(page.getByLabel('Full name')).toHaveValue('Ada Lovelace')

  await page.getByRole('button', { name: 'Accept changes' }).click()
  await placeOrderButton(page).click()

  await expectOrderPlaced(page)
  expect(await storedCart(page)).toEqual([])
})

test('a cart with nothing left to buy can be accepted and ends up empty', async ({ page }) => {
  await seedCart(page, [{ slug: 'arc-studio', quantity: 1 }])
  await open(page, '/checkout')

  await expect(page.getByText('Arc Studio is sold out.')).toBeVisible()
  await expect(placeOrderButton(page)).toBeHidden()

  await page.getByRole('button', { name: 'Accept changes' }).click()

  await expect(page.getByText('Your cart is empty, so there’s nothing to check out yet.')).toBeVisible()
  expect(await storedCart(page)).toEqual([])
})

test('recovers when the order can’t be loaded', async ({ page }) => {
  await page.route('**/api/cart/quote', (route) => route.fulfill({ status: 503, json: {} }))
  await seedCart(page, [{ slug: 'arc-one', quantity: 1 }])
  await open(page, '/checkout')

  const alert = page.getByRole('alert').filter({ hasText: 'We couldn’t load your order.' })
  await expect(alert).toBeVisible()

  await page.unroute('**/api/cart/quote')
  await alert.getByRole('button', { name: 'Try again' }).click()

  await expect(alert).toBeHidden()
  await expect(placeOrderButton(page)).toBeEnabled()
})

test('keeps the cart when placing the order fails, and can try again', async ({ page }) => {
  await page.route('**/api/checkout', (route) => route.abort())
  await seedCart(page, [{ slug: 'arc-one', quantity: 1 }])
  await open(page, '/checkout')
  await fillCheckout(page)

  await placeOrderButton(page).click()

  await expect(page.getByText('Something went wrong placing your order.')).toBeVisible()
  expect(await storedCart(page)).toEqual([{ slug: 'arc-one', quantity: 1 }])

  await page.unroute('**/api/checkout')
  await placeOrderButton(page).click()
  await expectOrderPlaced(page)
})

test('refreshes the totals when the cart changes in another tab', async ({ context }) => {
  const checkout = await context.newPage()
  await seedCart(checkout, [{ slug: 'macro-9', quantity: 1 }])
  await open(checkout, '/checkout')
  await expect(checkout.getByText('$77.00')).toBeVisible()

  const other = await context.newPage()
  await open(other, '/cart')
  await other.getByLabel('Quantity of Macro 9').selectOption('2')

  await expect(checkout.getByText('2 × Macro 9')).toBeVisible()
  await expect(checkout.getByText('$138.00').first()).toBeVisible()
})
