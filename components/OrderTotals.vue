<script setup lang="ts">
import type { Quote } from '~~/types/store'

defineProps<{ quote: Quote }>()
</script>

<template>
  <dl class="space-y-2 text-sm">
    <div class="flex justify-between gap-4">
      <dt class="text-muted">Subtotal</dt>
      <dd class="font-mono tabular-nums">{{ formatPrice(quote.subtotalCents) }}</dd>
    </div>
    <div class="flex justify-between gap-4">
      <dt class="text-muted">Shipping</dt>
      <dd class="font-mono tabular-nums">{{ quote.shippingCents ? formatPrice(quote.shippingCents) : 'Free' }}</dd>
    </div>
    <div class="flex justify-between gap-4 border-t border-rule pt-3 text-base font-semibold">
      <dt>Total</dt>
      <dd class="font-mono tabular-nums">{{ formatPrice(quote.totalCents) }}</dd>
    </div>
  </dl>
</template>
