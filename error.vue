<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const isNotFound = computed(() => props.error.statusCode === 404)

useSeoMeta({
  title: () => (isNotFound.value ? 'Page not found | Lowpass' : 'Something went wrong | Lowpass'),
  robots: 'noindex, nofollow',
})
</script>

<template>
  <NuxtLayout>
    <div class="wrap py-24 text-center">
      <p class="eyebrow">Error {{ error.statusCode }}</p>
      <h1 class="mt-3 text-5xl font-semibold tracking-tight">
        {{ isNotFound ? 'We can’t find that page.' : 'Something went wrong.' }}
      </h1>
      <button type="button" class="btn mt-8" @click="clearError({ redirect: '/products' })">Back to the shop</button>
    </div>
  </NuxtLayout>
</template>
