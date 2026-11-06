<script setup lang="ts">
import type { OrderConfirmation, Quote } from '~~/types/store'

usePageSeo({
  title: 'Checkout',
  description: 'Complete your Lowpass demo order. This is a mock checkout and no payment is taken.',
  path: '/checkout',
  noindex: true,
})

const { items, ready, load, clear } = useCart()
const quote = ref<Quote | null>(null)
const form = reactive({ name: '', email: '', address: '' })
const submitting = ref(false)
const errorMessage = ref('')
const order = ref<OrderConfirmation | null>(null)

onMounted(async () => {
  load()
  try {
    quote.value = await $fetch<Quote>('/api/cart/quote', { method: 'POST', body: { items: items.value } })
  } catch {
    errorMessage.value = 'We couldn’t load your order. Please refresh the page to try again.'
  }
})

async function placeOrder() {
  submitting.value = true
  errorMessage.value = ''
  try {
    order.value = await $fetch<OrderConfirmation>('/api/checkout', {
      method: 'POST',
      body: { ...form, items: items.value },
    })
    clear()
  } catch (error) {
    const message = (error as { statusMessage?: string }).statusMessage
    errorMessage.value = message || 'Something went wrong placing your order. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="wrap pt-10">
    <div v-if="order" class="mx-auto max-w-xl rounded-xl bg-white p-8 text-center sm:p-12">
      <p class="eyebrow">Demo order placed</p>
      <h1 class="mt-3 text-4xl font-semibold tracking-tight">Thanks, that’s all done.</h1>
      <p class="mt-4 font-mono text-lg">{{ order.orderNumber }}</p>
      <p class="mt-4 leading-relaxed text-muted">
        In a real store, a {{ formatPrice(order.totalCents) }} receipt would now be on its way to {{ order.email }}.
        This is a demo, so nothing was charged, sent or saved.
      </p>
      <NuxtLink to="/products" class="btn mt-8">Keep browsing</NuxtLink>
    </div>

    <template v-else>
      <h1 class="text-5xl font-semibold tracking-tight sm:text-6xl">Checkout</h1>
      <p class="mt-4 max-w-xl text-muted">
        This is a mock checkout. No payment is taken and your details aren’t stored.
      </p>

      <div
        v-if="!ready || (!quote && !errorMessage)"
        class="mt-10 h-48 animate-pulse rounded-xl bg-rule/50"
        aria-label="Loading your order"
      />

      <div v-else-if="quote && !quote.lines.length" class="mt-10 rounded-xl border border-rule p-10 text-center">
        <p class="text-lg">Your cart is empty, so there’s nothing to check out yet.</p>
        <NuxtLink to="/products" class="btn mt-5">Browse products</NuxtLink>
      </div>

      <div v-else class="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr] lg:gap-16">
        <form class="max-w-xl space-y-5" @submit.prevent="placeOrder">
          <label class="block">
            <span class="text-sm font-medium">Full name</span>
            <input v-model="form.name" class="field" type="text" name="name" autocomplete="name" required />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Email</span>
            <input v-model="form.email" class="field" type="email" name="email" autocomplete="email" required />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Shipping address</span>
            <textarea
              v-model="form.address"
              class="field"
              name="address"
              rows="3"
              autocomplete="street-address"
              required
            />
          </label>
          <p v-if="errorMessage" class="rounded-lg bg-rule/50 p-4 text-sm" role="alert">{{ errorMessage }}</p>
          <button type="submit" class="btn w-full sm:w-auto" :disabled="submitting || !quote">
            {{ submitting ? 'Placing order…' : 'Place demo order' }}
          </button>
        </form>

        <aside v-if="quote" aria-labelledby="order-heading" class="self-start rounded-xl bg-white p-6">
          <h2 id="order-heading" class="text-xl font-semibold">Your order</h2>
          <ul class="my-4 space-y-2 border-b border-rule pb-4 text-sm">
            <li v-for="line in quote.lines" :key="line.slug" class="flex justify-between gap-4">
              <span>{{ line.quantity }} × {{ line.name }}</span>
              <span class="font-mono tabular-nums">{{ formatPrice(line.lineTotalCents) }}</span>
            </li>
          </ul>
          <OrderTotals :quote="quote" />
          <NuxtLink to="/cart" class="mt-4 inline-block text-sm underline underline-offset-4">Edit cart</NuxtLink>
        </aside>
      </div>
    </template>
  </div>
</template>
