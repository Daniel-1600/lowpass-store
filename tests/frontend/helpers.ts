import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export type StoredItem = { slug: string; quantity: number }

/** Seeds the cart once, so that later reloads in the test keep what the app saved. */
export async function seedCart(page: Page, items: unknown[]) {
  await page.addInitScript((value) => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('lowpass-cart', value)
  }, JSON.stringify(items))
}

export const storedCart = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('lowpass-cart') ?? '[]') as StoredItem[])

/** Forms and buttons only work once Vue has taken over the server-rendered page. */
export async function open(page: Page, path: string) {
  await page.goto(path)
  await page.waitForFunction(() => {
    const app = (window as unknown as { useNuxtApp?: () => { isHydrating?: boolean } }).useNuxtApp
    return app && !app().isHydrating
  })
}

export async function fillCheckout(page: Page) {
  await page.getByLabel('Full name').fill('Ada Lovelace')
  await page.getByLabel('Email').fill('ada@example.com')
  await page.getByLabel('Shipping address').fill('1 Analytical Way')
}

export const placeOrderButton = (page: Page) => page.getByRole('button', { name: 'Place demo order' })

export const expectOrderPlaced = (page: Page) =>
  expect(page.getByRole('heading', { name: 'Thanks, that’s all done.' })).toBeVisible()
