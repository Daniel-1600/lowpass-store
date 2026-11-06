<script setup lang="ts">
const { data: products } = await useFetch('/api/products')

usePageSeo({
  title: 'All Products',
  description:
    'Browse every Lowpass product: headphones, powered speakers, mechanical keyboards, DACs, chargers and power banks.',
  path: '/products',
  jsonLd: [
    breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'All products', path: '/products' }]),
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
    <ProductListing v-if="products" :products="products" class="mt-6" />
  </div>
</template>
