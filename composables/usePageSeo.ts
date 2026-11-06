interface PageSeo {
  /** Page title without the brand; the suffix is added here. Use `absoluteTitle` for the home page. */
  title?: string
  absoluteTitle?: string
  description: string
  /** Path beginning with "/", used for the canonical and og:url. */
  path: string
  /** Root-relative path to a 1200x630 image. */
  image?: string
  ogType?: 'website' | 'product'
  noindex?: boolean
  /** One or more schema.org objects to output as JSON-LD. */
  jsonLd?: object | object[]
}

const BRAND = 'Lowpass'

// "<" is escaped so catalogue text can never close the script tag.
const serializeJsonLd = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c')

/** The single place every page sets its title, meta, Open Graph, canonical and structured data. */
export function usePageSeo(seo: PageSeo) {
  const site = useRuntimeConfig().public.siteUrl
  const title = seo.absoluteTitle ?? `${seo.title} | ${BRAND}`
  const url = `${site}${seo.path}`
  const image = `${site}${seo.image ?? '/images/og/default.jpg'}`

  useSeoMeta({
    title,
    description: seo.description,
    robots: seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    ogSiteName: BRAND,
    ogLocale: 'en_US',
    // "product" is a valid Open Graph type that useSeoMeta's types leave out.
    ogType: (seo.ogType ?? 'website') as 'website',
    ogTitle: title,
    ogDescription: seo.description,
    ogUrl: url,
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageType: 'image/jpeg',
    ogImageAlt: title,
    twitterCard: 'summary_large_image',
  })

  useHead({
    link: [{ rel: 'canonical', href: url }],
    script: [seo.jsonLd ?? []].flat().map((data) => ({
      type: 'application/ld+json',
      innerHTML: serializeJsonLd(data),
    })),
  })
}

export function breadcrumbJsonLd(crumbs: Array<{ name: string; path: string }>) {
  const site = useRuntimeConfig().public.siteUrl
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${site}${crumb.path}`,
    })),
  }
}

export function itemListJsonLd(products: Array<{ name: string; slug: string }>) {
  const site = useRuntimeConfig().public.siteUrl
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: `${site}/products/${product.slug}`,
    })),
  }
}
