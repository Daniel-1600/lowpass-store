import { expect, test } from '@playwright/test'
import { open } from './helpers'

const block = (url: string) => (route: import('@playwright/test').Route) =>
  route.request().url().includes(url) ? route.abort() : route.fallback()

test('an unknown product is a real 404', async ({ page }) => {
  const response = await page.goto('/products/does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'We can’t find that page.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again' })).toBeHidden()
})

test('an unknown category is a real 404', async ({ page }) => {
  const response = await page.goto('/category/does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'We can’t find that page.' })).toBeVisible()
})

test('an outage on a product page isn’t reported as a 404, and can be retried', async ({ page }) => {
  await open(page, '/products')
  await page.route('**/*', block('/products/pad-2/_payload.json'))
  await page.route('**/api/products/pad-2', (route) => route.abort())

  await page.getByRole('link', { name: /Pad 2/ }).first().click()

  await expect(page.getByRole('heading', { name: 'Something went wrong.' })).toBeVisible()
  await expect(page.getByText('Error 503')).toBeVisible()

  await page.unrouteAll()
  await page.getByRole('button', { name: 'Try again' }).click()

  await expect(page.getByRole('heading', { name: 'Pad 2', level: 1 })).toBeVisible()
})

test('an outage on the product listing offers a retry that recovers', async ({ page }) => {
  await open(page, '/')
  await page.route('**/*', block('/products/_payload.json'))
  await page.route('**/api/products', (route) => route.abort())

  await page.getByRole('link', { name: 'Shop all products' }).click()

  const alert = page.getByRole('alert').filter({ hasText: 'We couldn’t load these products.' })
  await expect(alert).toBeVisible()

  await page.unrouteAll()
  await alert.getByRole('button', { name: 'Try again' }).click()

  await expect(page.getByText('12 products')).toBeVisible()
  await expect(alert).toBeHidden()
})

test('an outage on a category listing offers a retry that recovers', async ({ page }) => {
  await open(page, '/products')
  await page.route('**/*', block('/category/power/_payload.json'))
  await page.route('**/api/products?category=power', (route) => route.abort())

  await page.getByRole('link', { name: 'Power', exact: true }).first().click()

  const alert = page.getByRole('alert').filter({ hasText: 'We couldn’t load these products.' })
  await expect(alert).toBeVisible()

  await page.unrouteAll()
  await alert.getByRole('button', { name: 'Try again' }).click()

  await expect(page.getByText('3 products', { exact: true })).toBeVisible()
})
