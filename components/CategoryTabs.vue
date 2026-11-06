<script setup lang="ts">
const { data: categories } = await useFetch('/api/categories', { key: 'nav-categories' })
const linkClass = 'whitespace-nowrap rounded-full border border-rule px-4 py-2 text-sm hover:border-ink'
const activeClass = '!border-ink bg-ink text-paper'
</script>

<template>
  <nav aria-label="Filter by category" class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
    <ul class="flex gap-2">
      <li><NuxtLink to="/products" :class="linkClass" :exact-active-class="activeClass" class="inline-block">All</NuxtLink></li>
      <li v-for="category in categories" :key="category.slug">
        <NuxtLink :to="`/category/${category.slug}`" :class="linkClass" :active-class="activeClass" class="inline-block">
          {{ category.name }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
