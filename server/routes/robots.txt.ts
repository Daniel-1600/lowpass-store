export default defineEventHandler((event) => {
  const site = useRuntimeConfig(event).public.siteUrl
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `User-agent: *
Disallow: /api/

Sitemap: ${site}/sitemap.xml
`
})
