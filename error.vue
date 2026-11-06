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
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <button v-if="!isNotFound" type="button" class="btn" @click="reloadNuxtApp({ force: true })">Try again</button>
        <button
          type="button"
          :class="isNotFound ? 'btn' : 'btn-outline'"
          @click="clearError({ redirect: '/products' })"
        >
          Back to the shop
        </button>
      </div>
    </div>
  </NuxtLayout>
</template>
