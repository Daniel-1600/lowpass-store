<script setup lang="ts">
import type { Category, ProductSummary } from '~~/types/store'
const slug = useRoute().params.slug as string
const [{ data: categories }, { data: products }] = await Promise.all([
  useFetch<Category[]>('/api/categories', { key: 'nav-categories' }),
  useFetch<ProductSummary[]>('/api/products', { query: { category: slug } }),
])

const found = categories.value?.find((c) => c.slug === slug)
if (!found) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found', fatal: true })
}
const category = found

usePageSeo({
  title: `Shop ${category.name}`,
  description: category.description,
  path: `/category/${slug}`,
  jsonLd: [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'All products', path: '/products' },
      { name: category.name, path: `/category/${slug}` },
    ]),
    itemListJsonLd(products.value ?? []),
  ],
})
</script>

<template>
  <div class="wrap pt-10">
    <h1 class="text-5xl font-semibold tracking-tight sm:text-6xl">{{ category.name }}</h1>
    <p class="mt-4 max-w-xl text-lg leading-relaxed text-muted">{{ category.description }}</p>
    <CategoryTabs class="mt-8" />
    <ProductListing v-if="products" :products="products" class="mt-6" />
  </div>
</template>
