const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
const siteUrl = (
  process.env.NUXT_PUBLIC_SITE_URL || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000')
).replace(/\/$/, '')

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/image', '@nuxt/fonts'],
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: { siteUrl },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      viewport: 'width=device-width, initial-scale=1',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [{ name: 'theme-color', content: '#F6F4EF' }],
    },
  },

  // The catalogue only changes on deploy, so public pages are static HTML.
  // Cart and checkout need no SEO and talk to the API live.
  routeRules: {
    '/': { prerender: true },
    '/products': { prerender: true },
    '/products/**': { prerender: true },
    '/category/**': { prerender: true },
    '/sitemap.xml': { prerender: true },
    '/robots.txt': { prerender: true },
  },

  nitro: {
    prerender: { crawlLinks: true, routes: ['/'], failOnError: true },
    routeRules: {
      // Cast: `headers` is valid at runtime but missing from this Nuxt version's config types.
      '/images/**': { headers: { 'cache-control': 'public, max-age=604800' } } as object,
    },
  },

  image: {
    format: ['avif', 'webp'],
    quality: 72,
    screens: { xs: 320, sm: 480, md: 640, lg: 960, xl: 1280, '2xl': 1600 },
  },

  fonts: {
    families: [
      { name: 'Instrument Sans', provider: 'google', weights: ['400 700'] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500] },
    ],
  },

  tailwindcss: { viewer: false },
})
