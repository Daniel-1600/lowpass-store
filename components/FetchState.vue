<script setup lang="ts">
defineProps<{ status: string; emptyMessage: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div v-if="status === 'pending'" class="h-48 animate-pulse rounded-xl bg-rule/50" aria-label="Loading products" />
  <p v-else-if="status === 'error'" class="rounded-lg bg-rule/50 p-4" role="alert">
    We couldn’t load these products.
    <button type="button" class="font-medium underline" @click="$emit('retry')">Try again</button>
  </p>
  <div v-else class="rounded-xl border border-rule p-10 text-center">
    <p class="text-lg">{{ emptyMessage }}</p>
    <NuxtLink to="/products" class="btn mt-5">Browse products</NuxtLink>
  </div>
</template>
