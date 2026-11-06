// Checks the SEO of a running site by reading only its raw HTML, as a crawler would.
//   npm run test:seo -- https://your-site.example   (defaults to http://localhost:3000)
const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '')
const failures = []
const check = (ok, message) => { if (!ok) failures.push(message) }

const attr = (html, pattern) => html.match(pattern)?.[1]
const meta = (html, key) =>
  attr(html, new RegExp(`<meta[^>]*(?:name|property)="${key}"[^>]*content="([^"]*)"`))

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text()
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
check(locs.length > 0, 'sitemap.xml lists no URLs')

const seenTitles = new Map()
const seenDescriptions = new Map()

for (const loc of locs) {
  const path = new URL(loc).pathname
  const res = await fetch(`${base}${path}`)
  const html = await res.text()
  const where = (m) => `${path}: ${m}`
  check(res.status === 200, where(`status ${res.status}`))

  const title = attr(html, /<title>([^<]*)<\/title>/)
  const description = meta(html, 'description')
  check(title, where('missing <title>'))
  check(description, where('missing meta description'))
  check(!seenTitles.has(title), where(`title duplicates ${seenTitles.get(title)}`))
  check(!seenDescriptions.has(description), where(`description duplicates ${seenDescriptions.get(description)}`))
  seenTitles.set(title, path)
  seenDescriptions.set(description, path)

  const canonical = attr(html, /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)
    ?? attr(html, /<link[^>]*href="([^"]*)"[^>]*rel="canonical"/)
  check(canonical === loc, where(`canonical ${canonical} differs from sitemap ${loc}`))
  for (const key of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'twitter:card']) {
    check(meta(html, key), where(`missing ${key}`))
  }
  check((html.match(/<h1[\s>]/g) ?? []).length === 1, where('should have exactly one <h1>'))

  const ogImage = meta(html, 'og:image')
  if (ogImage) {
    const image = await fetch(`${base}${new URL(ogImage).pathname}`)
    check(image.ok, where(`og:image returned ${image.status}`))
  }

  const jsonLd = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
  if (path.startsWith('/products/')) {
    const product = jsonLd.find((d) => d['@type'] === 'Product')
    check(product?.name && product?.image && product?.offers?.price && product?.offers?.availability,
      where('incomplete Product JSON-LD'))
    check(jsonLd.some((d) => d['@type'] === 'BreadcrumbList'), where('missing BreadcrumbList JSON-LD'))
    check(html.includes(product?.name), where('Product name is not in the HTML'))
    check(meta(html, 'product:price:amount') === product?.offers?.price, where('product:price:amount differs from the schema price'))
  }
}

const missing = await fetch(`${base}/products/does-not-exist`)
check(missing.status === 404, `unknown product returned ${missing.status}, expected 404`)
const robots = await (await fetch(`${base}/robots.txt`)).text()
check(/Sitemap: https?:\/\//.test(robots), 'robots.txt does not reference the sitemap')
for (const path of ['/cart', '/checkout']) {
  const html = await (await fetch(`${base}${path}`)).text()
  check(meta(html, 'robots')?.includes('noindex'), `${path} should be noindex`)
}

if (failures.length) {
  console.error(`FAILED ${failures.length} checks:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log(`OK: ${locs.length} sitemap URLs checked at ${base}`)
