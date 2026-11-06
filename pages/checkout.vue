<script setup lang="ts">
import type { OrderConfirmation, Quote } from '~~/types/store'

usePageSeo({
  title: 'Checkout',
  description: 'Complete your Lowpass demo order. This is a mock checkout and no payment is taken.',
  path: '/checkout',
  noindex: true,
})

const { items, ready, load, setQuantity, clear } = useCart()
const quote = ref<Quote | null>(null)
const form = reactive({ name: '', email: '', address: '' })
const loading = ref(true)
const loadFailed = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const order = ref<OrderConfirmation | null>(null)
// Set when the server refuses the order because it differs from the one on screen.
const orderChanged = ref(false)
const reviewedTotalCents = ref<number | null>(null)

const needsConfirmation = computed(() => orderChanged.value || Boolean(quote.value?.changes.length))
const canSubmit = computed(
  () => Boolean(quote.value?.lines.length) && !loading.value && !loadFailed.value && !needsConfirmation.value,
)

// A sequence number discards responses that arrive after a newer request was sent.
let latestRequest = 0
async function refresh() {
  const request = ++latestRequest
  loading.value = true
  loadFailed.value = false
  try {
    const result = await $fetch<Quote>('/api/cart/quote', { method: 'POST', body: { items: items.value } })
    if (request === latestRequest) quote.value = result
  } catch {
    if (request === latestRequest) loadFailed.value = true
  } finally {
    if (request === latestRequest) loading.value = false
  }
}

onMounted(() => {
  load()
  watch(
    items,
    () => {
      if (!order.value) refresh()
    },
    { immediate: true },
  )
})

// The shopper agrees to the updated order. Nothing is placed until they submit it.
function acceptChanges() {
  const sellable = new Map(quote.value?.lines.map((line) => [line.slug, line.quantity]))
  for (const item of items.value) {
    const quantity = sellable.get(item.slug) ?? 0
    if (quantity !== item.quantity) setQuantity(item.slug, quantity)
  }
  orderChanged.value = false
  reviewedTotalCents.value = null
}

async function placeOrder() {
  if (!quote.value || !canSubmit.value) return
  submitting.value = true
  errorMessage.value = ''
  const submittedCart = JSON.stringify(items.value)
  try {
    order.value = await $fetch<OrderConfirmation>('/api/checkout', {
      method: 'POST',
      body: { ...form, items: items.value, reviewedFingerprint: quote.value.fingerprint },
    })
    // Keep anything added in another tab while the order was on its way.
    if (JSON.stringify(items.value) === submittedCart) clear()
  } catch (error) {
    const data = (error as { data?: { statusMessage?: string; data?: { quote?: Quote } } }).data
    if (data?.data?.quote) {
      latestRequest++ // This quote is newer than any request still in flight.
      loading.value = false
      reviewedTotalCents.value = quote.value.totalCents
      quote.value = data.data.quote
      orderChanged.value = true
    } else {
      errorMessage.value = data?.statusMessage || 'Something went wrong placing your order. Please try again.'
    }
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

      <p v-if="loadFailed" class="mt-8 rounded-lg bg-rule/50 p-4" role="alert">
        We couldn’t load your order.
        <button type="button" class="font-medium underline" @click="refresh">Try again</button>
      </p>

      <section v-if="quote && needsConfirmation" class="mt-8 rounded-lg bg-rule/50 p-4" role="alert">
        <h2 class="font-semibold">Your order has changed</h2>
        <p class="mt-1 text-sm">Please check the update. We won’t place your order until you accept it.</p>
        <CartChanges :changes="quote.changes" class="mt-3" />
        <p v-if="reviewedTotalCents !== null && reviewedTotalCents !== quote.totalCents" class="mt-3 text-sm">
          Your total went from {{ formatPrice(reviewedTotalCents) }} to {{ formatPrice(quote.totalCents) }}.
        </p>
        <button type="button" class="btn mt-4" @click="acceptChanges">Accept changes</button>
      </section>

      <div
        v-if="!ready || (!quote && !loadFailed)"
        class="mt-10 h-48 animate-pulse rounded-xl bg-rule/50"
        aria-label="Loading your order"
      />

      <div
        v-else-if="quote && !quote.lines.length && !needsConfirmation"
        class="mt-10 rounded-xl border border-rule p-10 text-center"
      >
        <p class="text-lg">Your cart is empty, so there’s nothing to check out yet.</p>
        <NuxtLink to="/products" class="btn mt-5">Browse products</NuxtLink>
      </div>

      <div v-else-if="quote?.lines.length" class="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr] lg:gap-16">
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
          <button type="submit" class="btn w-full sm:w-auto" :disabled="submitting || !canSubmit">
            {{ submitting ? 'Placing order…' : 'Place demo order' }}
          </button>
        </form>

        <aside aria-labelledby="order-heading" aria-live="polite" class="self-start rounded-xl bg-white p-6">
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
