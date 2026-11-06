const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export default defineEventHandler((event) => {
  const site = useRuntimeConfig(event).public.siteUrl
  const lastUpdated = getSitemapEntries().map((p) => p.updated_at).sort().at(-1)

  const urls: Array<{ loc: string; lastmod?: string; image?: string }> = [
    { loc: `${site}/`, lastmod: lastUpdated },
    { loc: `${site}/products`, lastmod: lastUpdated },
    ...listCategories().map((c) => ({ loc: `${site}/category/${c.slug}`, lastmod: lastUpdated })),
    ...getSitemapEntries().map((p) => ({
      loc: `${site}/products/${p.slug}`,
      lastmod: p.updated_at,
      image: `${site}/images/products/${p.slug}.webp`,
    })),
  ]

  const body = urls
    .map((u) => {
      const image = u.image ? `<image:image><image:loc>${escapeXml(u.image)}</image:loc></image:image>` : ''
      return `<url><loc>${escapeXml(u.loc)}</loc><lastmod>${u.lastmod}</lastmod>${image}</url>`
    })
    .join('')

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>`
})
