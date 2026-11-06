<script setup lang="ts">
import type { ProductSummary } from '~~/types/store'

const props = defineProps<{ products: ProductSummary[] }>()

const sort = ref<'default' | 'price-asc' | 'price-desc'>('default')
const sorted = computed(() => {
  if (sort.value === 'default') return props.products
  const direction = sort.value === 'price-asc' ? 1 : -1
  return [...props.products].sort((a, b) => (a.priceCents - b.priceCents) * direction)
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-4 border-b border-rule pb-3">
      <p class="font-mono text-xs text-muted" aria-live="polite">{{ products.length }} products</p>
      <label class="flex items-center gap-2 text-sm">
        <span class="text-muted">Sort</span>
        <select v-model="sort" class="min-h-11 rounded-lg border border-rule bg-white px-2 text-sm">
          <option value="default">Recommended</option>
          <option value="price-asc">Price, low to high</option>
          <option value="price-desc">Price, high to low</option>
        </select>
      </label>
    </div>
    <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      <ProductCard v-for="(product, index) in sorted" :key="product.slug" :product="product" :priority="index < 2" />
    </div>
  </div>
</template>
