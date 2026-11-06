<script setup lang="ts">
const { data: categories } = await useFetch('/api/categories', { key: 'nav-categories' })
const { count, ready, load } = useCart()
onMounted(load)

const menuOpen = ref(false)
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

const cartLabel = computed(() =>
  ready.value && count.value ? `Cart, ${count.value} ${count.value === 1 ? 'item' : 'items'}` : 'Cart',
)
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
    >
      Skip to content
    </a>

    <header class="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur">
      <div class="wrap flex h-16 items-center justify-between gap-6">
        <NuxtLink to="/" class="flex items-center gap-2 text-xl font-semibold tracking-tight" aria-label="Lowpass home">
          <svg viewBox="0 0 32 20" class="h-4 w-7" aria-hidden="true">
            <path d="M2 5h12c7 0 7 10 16 10" fill="none" stroke="#E4572E" stroke-width="3.5" stroke-linecap="round" />
          </svg>
          Lowpass
        </NuxtLink>

        <nav aria-label="Shop categories" class="hidden items-center gap-7 md:flex">
          <NuxtLink
            to="/products"
            class="text-sm hover:text-signal-strong"
            active-class="font-semibold"
            exact-active-class="font-semibold"
            >All products</NuxtLink
          >
          <NuxtLink
            v-for="category in categories"
            :key="category.slug"
            :to="`/category/${category.slug}`"
            class="text-sm hover:text-signal-strong"
            active-class="font-semibold"
          >
            {{ category.name }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <NuxtLink
            to="/cart"
            :aria-label="cartLabel"
            class="flex min-h-11 items-center gap-2 rounded-full border border-ink px-4 text-sm font-medium hover:bg-ink hover:text-paper"
          >
            Cart
            <span v-if="ready && count" class="font-mono text-xs font-medium tabular-nums" aria-hidden="true">{{
              count
            }}</span>
          </NuxtLink>
          <button
            type="button"
            class="min-h-11 rounded-full px-3 text-sm font-medium md:hidden"
            :aria-expanded="menuOpen"
            aria-controls="mobile-nav"
            @click="menuOpen = !menuOpen"
          >
            Menu
          </button>
        </div>
      </div>
      <nav
        v-show="menuOpen"
        id="mobile-nav"
        aria-label="Shop categories, mobile"
        class="border-t border-rule md:hidden"
      >
        <div class="wrap flex flex-col py-2">
          <NuxtLink to="/products" class="py-3">All products</NuxtLink>
          <NuxtLink v-for="category in categories" :key="category.slug" :to="`/category/${category.slug}`" class="py-3">
            {{ category.name }}
          </NuxtLink>
        </div>
      </nav>
    </header>

    <main id="main" class="flex-1">
      <slot />
    </main>

    <footer class="mt-24 bg-ink text-paper">
      <div class="wrap grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p class="text-xl font-semibold tracking-tight">Lowpass</p>
          <p class="mt-3 max-w-sm text-sm leading-relaxed text-[#B9B8B1]">
            A demonstration store with fictional products. Nothing here is for sale and no payment is ever taken.
          </p>
        </div>
        <nav aria-label="Footer: shop">
          <p class="eyebrow !text-[#B9B8B1]">Shop</p>
          <ul class="mt-4 space-y-2 text-sm">
            <li><NuxtLink to="/products" class="hover:underline">All products</NuxtLink></li>
            <li v-for="category in categories" :key="category.slug">
              <NuxtLink :to="`/category/${category.slug}`" class="hover:underline">{{ category.name }}</NuxtLink>
            </li>
          </ul>
        </nav>
        <div>
          <p class="eyebrow !text-[#B9B8B1]">Shipping</p>
          <p class="mt-4 text-sm leading-relaxed">Free over $100.<br />Otherwise a flat $8.</p>
        </div>
      </div>
    </footer>
  </div>
</template>
