<script setup lang="ts">
import type { QuoteChange } from '~~/types/store'

defineProps<{ changes: QuoteChange[] }>()

function describe(change: QuoteChange) {
  const name = change.name ?? 'An item in your cart'
  if (change.reason === 'unavailable') return `${name} is no longer available.`
  if (change.reason === 'sold_out') return `${name} is sold out.`
  return `${name}: only ${change.availableQuantity} available, so your quantity goes from ${change.requestedQuantity} to ${change.availableQuantity}.`
}
</script>

<template>
  <ul class="space-y-1 text-sm">
    <li v-for="change in changes" :key="change.slug">{{ describe(change) }}</li>
  </ul>
</template>
