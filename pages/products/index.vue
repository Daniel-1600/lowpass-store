<script setup lang="ts">
import type { ProductSummary } from '~~/types/store'
const { data: products, error, status, refresh } = await useFetch<ProductSummary[]>('/api/products')
if (import.meta.server && error.value) throw catalogueOutage()

usePageSeo({
  title: 'All Products',
  description:
    'Browse every Lowpass product: headphones, powered speakers, mechanical keyboards, DACs, chargers and power banks.',
  path: '/products',
  jsonLd: [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'All products', path: '/products' },
    ]),
    itemListJsonLd(products.value ?? []),
  ],
})
</script>

<template>
  <div class="wrap pt-10">
    <h1 class="text-5xl font-semibold tracking-tight sm:text-6xl">All products</h1>
    <p class="mt-4 max-w-xl text-lg leading-relaxed text-muted">
      The whole catalogue. Twelve things we like enough to put our name on.
    </p>
    <CategoryTabs class="mt-8" />
    <ProductListing v-if="products?.length" :products="products" class="mt-6" />
    <FetchState
      v-else
      :status="status"
      empty-message="There’s nothing in the catalogue right now."
      class="mt-6"
      @retry="refresh()"
    />
  </div>
</template>
