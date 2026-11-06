import { expect, test } from '@playwright/test'
import { open, seedCart, storedCart } from './helpers'

test('adds a product to the cart', async ({ page }) => {
  await open(page, '/products/arc-one')
  await page.getByLabel('Quantity').selectOption('2')
  await page.getByRole('button', { name: 'Add to cart' }).click()

  await expect(page.getByText('Added to your cart.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible()
  expect(await storedCart(page)).toEqual([{ slug: 'arc-one', quantity: 2 }])

  await page.getByRole('link', { name: 'View cart' }).click()
  await expect(page.getByRole('link', { name: 'Arc One' })).toBeVisible()
  await expect(page.getByLabel('Quantity of Arc One')).toHaveValue('2')
})

test('changing a quantity reprices the cart', async ({ page }) => {
  await seedCart(page, [{ slug: 'arc-one', quantity: 1 }])
  await open(page, '/cart')
  await expect(page.getByText('$249.00').first()).toBeVisible()

  await page.getByLabel('Quantity of Arc One').selectOption('3')

  await expect(page.getByText('$747.00').first()).toBeVisible()
  expect(await storedCart(page)).toEqual([{ slug: 'arc-one', quantity: 3 }])
})

test('removing the last item shows the empty cart', async ({ page }) => {
  await seedCart(page, [{ slug: 'arc-one', quantity: 1 }])
  await open(page, '/cart')

  await page.getByRole('button', { name: 'Remove Arc One' }).click()

  await expect(page.getByText('Your cart is empty.')).toBeVisible()
  expect(await storedCart(page)).toEqual([])
})

test('reports what changed when a stored cart can’t be sold as it is', async ({ page }) => {
  await seedCart(page, [
    { slug: 'arc-one', quantity: 99 },
    { slug: 'arc-studio', quantity: 1 },
    { slug: 'gone', quantity: 1 },
  ])
  await open(page, '/cart')

  await expect(page.getByText('Arc One: only 18 available, so your quantity goes from 99 to 18.')).toBeVisible()
  await expect(page.getByText('Arc Studio is sold out.')).toBeVisible()
  await expect(page.getByText('An item in your cart is no longer available.')).toBeVisible()
  await expect.poll(() => storedCart(page)).toEqual([{ slug: 'arc-one', quantity: 18 }])
})

test('cleans up duplicate and invalid entries from storage', async ({ page }) => {
  await seedCart(page, [
    { slug: 'pad-2', quantity: 1 },
    { slug: 'pad-2', quantity: 2 },
    { slug: 'pad-2', quantity: -4 },
    'junk',
  ])
  await open(page, '/cart')

  await expect(page.getByLabel('Quantity of Pad 2')).toHaveValue('3')
  expect(await storedCart(page)).toEqual([{ slug: 'pad-2', quantity: 3 }])
})

test('won’t add a new product to a full cart', async ({ page }) => {
  await seedCart(
    page,
    Array.from({ length: 50 }, (_, i) => ({ slug: `placeholder-${i}`, quantity: 1 })),
  )
  await open(page, '/products/arc-one')

  await page.getByRole('button', { name: 'Add to cart' }).click()

  await expect(page.getByText('Your cart is full.')).toBeVisible()
  const cart = await storedCart(page)
  expect(cart).toHaveLength(50)
  expect(cart.some((item) => item.slug === 'arc-one')).toBe(false)
})

test('keeps the cart in sync across tabs', async ({ context }) => {
  const cartTab = await context.newPage()
  const productTab = await context.newPage()
  await open(cartTab, '/cart')
  await expect(cartTab.getByText('Your cart is empty.')).toBeVisible()

  await open(productTab, '/products/pad-2')
  await productTab.getByRole('button', { name: 'Add to cart' }).click()
  await expect(productTab.getByText('Added to your cart.')).toBeVisible()

  await expect(cartTab.getByLabel('Quantity of Pad 2')).toHaveValue('1')
  await expect(cartTab.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible()
})
