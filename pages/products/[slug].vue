<script setup lang="ts">
import type { Product, ProductSummary } from '~~/types/store'
const slug = useRoute().params.slug as string
const site = useRuntimeConfig().public.siteUrl
const { data: product, error } = await useFetch<Product>(`/api/products/${slug}`)
if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
}
if (!product.value) throw catalogueOutage()
const p = product.value

const { data: allInCategory } = await useFetch<ProductSummary[]>('/api/products', {
  query: { category: p.categorySlug },
})
const related = computed(() => allInCategory.value?.filter((item) => item.slug !== slug).slice(0, 2) ?? [])

const inStock = p.stock > 0
const path = `/products/${slug}`
const crumbs = [
  { name: 'Home', path: '/' },
  { name: p.categoryName, path: `/category/${p.categorySlug}` },
  { name: p.name, path },
]

// Keep the promised price valid for a year from the last catalogue update.
const priceValidUntil = `${Number(p.updatedAt.slice(0, 4)) + 1}${p.updatedAt.slice(4)}`

usePageSeo({
  title: `${p.name}: ${p.tagline}`,
  description: `${p.tagline}. ${formatPrice(p.priceCents)}, ${inStock ? 'in stock with free shipping over $100' : 'currently sold out'}. See full specs for the Lowpass ${p.name}.`,
  path,
  image: `/images/og/${slug}.jpg`,
  ogType: 'product',
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description,
      sku: p.sku,
      category: p.categoryName,
      image: `${site}${p.image}`,
      brand: { '@type': 'Brand', name: 'Lowpass' },
      url: `${site}${path}`,
      offers: {
        '@type': 'Offer',
        url: `${site}${path}`,
        price: (p.priceCents / 100).toFixed(2),
        priceCurrency: 'USD',
        priceValidUntil,
        itemCondition: 'https://schema.org/NewCondition',
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: 'Lowpass' },
      },
    },
    breadcrumbJsonLd(crumbs),
  ],
})

// Open Graph product price tags, used by Facebook and Pinterest.
useHead({
  meta: [
    { property: 'product:price:amount', content: (p.priceCents / 100).toFixed(2) },
    { property: 'product:price:currency', content: 'USD' },
  ],
})

const { add, items } = useCart()
const quantity = ref(1)
const added = ref(false)
const cartFull = ref(false)
let addedTimer: ReturnType<typeof setTimeout> | undefined

const inCart = computed(() => items.value.find((item) => item.slug === slug)?.quantity ?? 0)
const remaining = computed(() => Math.max(p.stock - inCart.value, 0))

function addToCart() {
  cartFull.value = !add(slug, quantity.value, p.stock)
  if (cartFull.value) {
    added.value = false
    return
  }
  quantity.value = 1
  added.value = true
  clearTimeout(addedTimer)
  addedTimer = setTimeout(() => {
    added.value = false
  }, 2500)
}
onBeforeUnmount(() => clearTimeout(addedTimer))
</script>

<template>
  <div class="wrap pt-6">
    <nav aria-label="Breadcrumb" class="font-mono text-xs text-muted">
      <ol class="flex flex-wrap gap-2">
        <li><NuxtLink to="/" class="hover:text-ink hover:underline">Home</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li>
          <NuxtLink :to="`/category/${p.categorySlug}`" class="hover:text-ink hover:underline">{{
            p.categoryName
          }}</NuxtLink>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" class="text-ink">{{ p.name }}</li>
      </ol>
    </nav>

    <div class="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div class="aspect-square self-start overflow-hidden rounded-2xl bg-rule md:sticky md:top-24">
        <NuxtPicture
          :src="p.image"
          :alt="p.imageAlt"
          width="960"
          height="960"
          sizes="xs:100vw sm:100vw md:50vw lg:50vw xl:640px"
          format="avif,webp"
          loading="eager"
          fetchpriority="high"
          preload
          :img-attrs="{ class: 'h-full w-full object-cover' }"
        />
      </div>

      <div>
        <h1 class="text-5xl font-semibold tracking-tight sm:text-6xl">{{ p.name }}</h1>
        <p class="mt-3 text-lg leading-snug text-muted">{{ p.tagline }}</p>

        <div class="mt-6 flex items-baseline justify-between gap-4 border-y border-rule py-4">
          <p class="font-mono text-2xl tabular-nums">{{ formatPrice(p.priceCents) }}</p>
          <p class="font-mono text-sm" :class="inStock && p.stock > 5 ? 'text-[#2F6B3C]' : 'text-signal-strong'">
            <template v-if="!inStock">Sold out</template>
            <template v-else-if="p.stock <= 5">Only {{ p.stock }} left</template>
            <template v-else>In stock</template>
          </p>
        </div>

        <form v-if="inStock" class="mt-6 flex flex-wrap items-end gap-3" @submit.prevent="addToCart">
          <label class="text-sm">
            <span class="eyebrow block">Quantity</span>
            <select
              v-model.number="quantity"
              class="mt-1.5 min-h-12 rounded-lg border border-rule bg-white px-3"
              :disabled="remaining === 0"
            >
              <option v-for="n in Math.min(Math.max(remaining, 1), 10)" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>
          <button type="submit" class="btn flex-1" :disabled="remaining === 0">
            {{ remaining === 0 ? 'All available stock is in your cart' : 'Add to cart' }}
          </button>
        </form>
        <p v-else class="mt-6 rounded-lg bg-rule/50 p-4 text-sm">
          This one is sold out right now. Take a look at the rest of our
          <NuxtLink :to="`/category/${p.categorySlug}`" class="underline">{{ p.categoryName.toLowerCase() }}</NuxtLink
          >.
        </p>
        <p class="mt-3 min-h-6 text-sm" role="status">
          <template v-if="added"
            >Added to your cart. <NuxtLink to="/cart" class="font-medium underline">View cart</NuxtLink></template
          >
          <template v-else-if="cartFull"
            >Your cart is full. <NuxtLink to="/cart" class="font-medium underline">Remove something</NuxtLink> to add
            this.</template
          >
        </p>

        <div class="mt-6 max-w-prose leading-relaxed">{{ p.description }}</div>

        <section class="mt-10" aria-labelledby="specs-heading">
          <h2 id="specs-heading" class="eyebrow">Specifications</h2>
          <dl class="mt-3 border-t border-rule">
            <div
              v-for="(value, label) in p.specs"
              :key="label"
              class="grid grid-cols-[2fr_3fr] gap-4 border-b border-rule py-3 text-sm"
            >
              <dt class="text-muted">{{ label }}</dt>
              <dd class="font-mono text-[0.8125rem]">{{ value }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>

    <section v-if="related.length" class="mt-24" aria-labelledby="related-heading">
      <h2 id="related-heading" class="mb-8 text-3xl font-semibold tracking-tight">
        More {{ p.categoryName.toLowerCase() }}
      </h2>
      <div class="grid grid-cols-2 gap-x-4 gap-y-10 lg:gap-x-6">
        <ProductCard v-for="item in related" :key="item.slug" :product="item" />
      </div>
    </section>
  </div>
</template>
