<script setup lang="ts">
import type { Quote } from '~~/types/store'

usePageSeo({
  title: 'Your Cart',
  description: 'Review the items in your Lowpass cart before checking out.',
  path: '/cart',
  noindex: true,
})

const { items, ready, setQuantity, load } = useCart()
const quote = ref<Quote | null>(null)
const failed = ref(false)
const cartChanged = ref(false)

// A sequence number discards responses that arrive after a newer request was sent.
let latestRequest = 0
async function refresh() {
  const request = ++latestRequest
  try {
    const result = await $fetch<Quote>('/api/cart/quote', { method: 'POST', body: { items: items.value } })
    if (request !== latestRequest) return
    quote.value = result
    failed.value = false
    // Bring the stored cart in line with what the server can actually sell.
    const sellable = new Map(result.lines.map((line) => [line.slug, line.quantity]))
    for (const item of items.value) {
      const quantity = sellable.get(item.slug) ?? 0
      if (quantity !== item.quantity) {
        cartChanged.value = true
        setQuantity(item.slug, quantity)
      }
    }
  } catch {
    if (request === latestRequest) failed.value = true
  }
}

onMounted(() => {
  load()
  watch(items, refresh, { immediate: true })
})
</script>

<template>
  <div class="wrap pt-10">
    <h1 class="text-5xl font-semibold tracking-tight sm:text-6xl">Your cart</h1>

    <p v-if="failed" class="mt-8 rounded-lg bg-rule/50 p-4" role="alert">
      We couldn’t load your cart prices. <button type="button" class="font-medium underline" @click="refresh">Try again</button>
    </p>

    <div v-else-if="!ready || !quote" class="mt-10 h-48 animate-pulse rounded-xl bg-rule/50" aria-label="Loading your cart" />

    <div v-else-if="!quote.lines.length" class="mt-10 rounded-xl border border-rule p-10 text-center">
      <p class="text-lg">Your cart is empty.</p>
      <NuxtLink to="/products" class="btn mt-5">Browse products</NuxtLink>
    </div>

    <div v-else class="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr] lg:gap-16">
      <div>
        <p v-if="cartChanged" class="mb-4 rounded-lg bg-rule/50 p-4 text-sm" role="status">
          We updated your cart to match the stock we have available.
        </p>
        <ul class="border-t border-rule">
          <li v-for="line in quote.lines" :key="line.slug" class="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-rule py-5 sm:grid-cols-[7rem_1fr_auto]">
            <NuxtImg :src="line.image" :alt="line.imageAlt" width="112" height="112" format="webp" loading="lazy" class="aspect-square w-full rounded-lg" />
            <div>
              <NuxtLink :to="`/products/${line.slug}`" class="font-semibold hover:text-signal-strong">{{ line.name }}</NuxtLink>
              <p class="mt-0.5 text-sm text-muted">{{ line.tagline }}</p>
              <div class="mt-3 flex items-center gap-4">
                <label class="flex items-center gap-2 text-sm">
                  <span class="sr-only">Quantity of {{ line.name }}</span>
                  <select
                    :value="line.quantity"
                    class="min-h-11 rounded-lg border border-rule bg-white px-2"
                    @change="setQuantity(line.slug, Number(($event.target as HTMLSelectElement).value))"
                  >
                    <option v-for="n in Math.min(line.stock, Math.max(10, line.quantity))" :key="n" :value="n">{{ n }}</option>
                  </select>
                </label>
                <button type="button" class="min-h-11 text-sm underline underline-offset-4 hover:text-signal-strong" :aria-label="`Remove ${line.name}`" @click="setQuantity(line.slug, 0)">
                  Remove
                </button>
              </div>
            </div>
            <p class="col-start-2 font-mono tabular-nums sm:col-start-3 sm:text-right">{{ formatPrice(line.lineTotalCents) }}</p>
          </li>
        </ul>
      </div>

      <aside aria-labelledby="summary-heading" class="self-start rounded-xl bg-white p-6 lg:sticky lg:top-24">
        <h2 id="summary-heading" class="text-xl font-semibold">Summary</h2>
        <OrderTotals :quote="quote" class="mt-4" />
        <NuxtLink to="/checkout" class="btn mt-6 w-full">Go to checkout</NuxtLink>
      </aside>
    </div>
  </div>
</template>
