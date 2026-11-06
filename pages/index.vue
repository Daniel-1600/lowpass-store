<script setup lang="ts">
import type { Category, ProductSummary } from '~~/types/store'
const site = useRuntimeConfig().public.siteUrl
const [{ data: featured, error, status, refresh }, { data: categories }] = await Promise.all([
  useFetch<ProductSummary[]>('/api/products', { query: { featured: 'true' } }),
  useFetch<Category[]>('/api/categories', { key: 'nav-categories' }),
])
if (import.meta.server && error.value) throw catalogueOutage()

const categoryImages: Record<string, { src: string; alt: string }> = {
  headphones: { src: '/images/products/arc-studio.webp', alt: 'Arc Studio headphones' },
  speakers: { src: '/images/products/cube-3.webp', alt: 'Cube 3 speakers' },
  'desk-gear': { src: '/images/products/macro-9.webp', alt: 'Macro 9 macro pad' },
  power: { src: '/images/products/brick-65.webp', alt: 'Brick 65 charger' },
}

usePageSeo({
  absoluteTitle: 'Lowpass | Headphones, Speakers & Desk Electronics',
  description:
    'Shop Lowpass for repairable headphones, powered speakers, mechanical keyboards and fast chargers. Free shipping on orders over $100.',
  path: '/',
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'OnlineStore',
      name: 'Lowpass',
      url: `${site}/`,
      logo: `${site}/favicon.svg`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Lowpass',
      url: `${site}/`,
    },
  ],
})
</script>

<template>
  <div>
    <section class="wrap grid items-center gap-8 pb-16 pt-10 md:grid-cols-2 md:pt-14 lg:gap-16">
      <div>
        <h1 class="text-[clamp(3rem,8vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
          Good sound,<br />small desk.
        </h1>
        <p class="mt-6 max-w-md text-lg leading-relaxed text-muted">
          Headphones, speakers and desk gear with real dials, replaceable parts and specs written in plain English.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink to="/products" class="btn">Shop all products</NuxtLink>
          <NuxtLink to="/products/room-radio" class="btn-outline">See the Room Radio</NuxtLink>
        </div>
      </div>
      <NuxtLink
        to="/products/room-radio"
        class="block aspect-square overflow-hidden rounded-2xl bg-rule"
        aria-label="Room Radio, $179"
      >
        <NuxtPicture
          src="/images/products/room-radio.webp"
          alt="Room Radio portable radio in signal orange with a carry handle and tuning dial"
          width="960"
          height="960"
          sizes="xs:100vw sm:100vw md:50vw lg:50vw xl:640px"
          format="avif,webp"
          loading="eager"
          fetchpriority="high"
          preload
          :img-attrs="{ class: 'h-full w-full object-cover' }"
        />
      </NuxtLink>
    </section>

    <section class="border-y border-rule">
      <ul class="wrap grid grid-cols-2 lg:grid-cols-4">
        <li
          v-for="category in categories"
          :key="category.slug"
          class="border-rule py-6 max-lg:even:border-l max-lg:even:pl-4 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0"
        >
          <NuxtLink :to="`/category/${category.slug}`" class="group flex items-center gap-4">
            <NuxtImg
              :src="categoryImages[category.slug]?.src"
              :alt="categoryImages[category.slug]?.alt"
              width="72"
              height="72"
              format="webp"
              loading="lazy"
              class="h-14 w-14 rounded-lg sm:h-[4.5rem] sm:w-[4.5rem]"
            />
            <span>
              <span class="block font-semibold group-hover:text-signal-strong">{{ category.name }}</span>
              <span class="font-mono text-xs text-muted">{{ category.productCount }} products</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section class="wrap pt-16" aria-labelledby="featured-heading">
      <div class="mb-8 flex items-end justify-between gap-4">
        <h2 id="featured-heading" class="text-3xl font-semibold tracking-tight sm:text-4xl">On our own desks</h2>
        <NuxtLink to="/products" class="text-sm font-medium underline underline-offset-4 hover:text-signal-strong"
          >View all</NuxtLink
        >
      </div>
      <div v-if="featured?.length" class="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
        <ProductCard v-for="product in featured" :key="product.slug" :product="product" />
      </div>
      <FetchState v-else :status="status" empty-message="Nothing is featured right now." @retry="refresh()" />
    </section>
  </div>
</template>
