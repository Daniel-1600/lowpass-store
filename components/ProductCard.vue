<script setup lang="ts">
import type { ProductSummary } from '~~/types/store'

withDefaults(defineProps<{ product: ProductSummary; priority?: boolean }>(), { priority: false })
</script>

<template>
  <article class="group relative">
    <div class="relative aspect-square overflow-hidden rounded-xl bg-rule">
      <NuxtPicture
        :src="product.image"
        :alt="product.imageAlt"
        width="640"
        height="640"
        sizes="xs:50vw sm:50vw md:33vw lg:25vw xl:320px"
        format="avif,webp"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'"
        :preload="priority"
        :img-attrs="{ class: 'h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]' }"
      />
      <span
        v-if="product.stock === 0"
        class="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 font-mono text-xs text-paper"
        >Sold out</span
      >
    </div>
    <div class="mt-3 flex items-start justify-between gap-3">
      <h3 class="font-semibold">
        <NuxtLink :to="`/products/${product.slug}`" class="after:absolute after:inset-0 group-hover:text-signal-strong">
          {{ product.name }}
        </NuxtLink>
      </h3>
      <p class="font-mono text-sm tabular-nums">{{ formatPrice(product.priceCents) }}</p>
    </div>
    <p class="mt-1 text-sm leading-snug text-muted">{{ product.tagline }}</p>
  </article>
</template>
