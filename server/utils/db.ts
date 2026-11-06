import { DatabaseSync } from 'node:sqlite'
import { categories, products, schema } from '../db/seed'
import type { Category, Product, ProductSummary } from '~~/types/store'

let db: DatabaseSync | undefined

// The catalogue is read-only at runtime, so each server instance builds its own
// in-memory SQLite database from the seed on first use. See README for the trade-off.
function getDb(): DatabaseSync {
  if (db) return db
  const conn = new DatabaseSync(':memory:')
  conn.exec(schema)

  const insertCategory = conn.prepare(
    'INSERT INTO categories (slug, name, description, position) VALUES (?, ?, ?, ?)',
  )
  categories.forEach((c, position) => insertCategory.run(c.slug, c.name, c.description, position))

  const insertProduct = conn.prepare(`
    INSERT INTO products (slug, sku, name, tagline, description, price_cents, stock, category_slug, image_alt, specs, featured, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  for (const p of products) {
    insertProduct.run(
      p.slug, p.sku, p.name, p.tagline, p.description, p.priceCents, p.stock,
      p.categorySlug, p.imageAlt, JSON.stringify(p.specs), p.featured ? 1 : 0, p.updatedAt,
    )
  }
  db = conn
  return conn
}

const PRODUCT_COLUMNS = `
  p.slug, p.sku, p.name, p.tagline, p.description, p.price_cents, p.stock,
  p.category_slug, c.name AS category_name, p.image_alt, p.specs, p.updated_at`
const FROM_PRODUCTS = 'FROM products p JOIN categories c ON c.slug = p.category_slug'

type ProductRow = Record<
  'slug' | 'sku' | 'name' | 'tagline' | 'description' | 'category_slug' | 'category_name' | 'image_alt' | 'specs' | 'updated_at',
  string
> & { price_cents: number; stock: number }

function toSummary(row: ProductRow): ProductSummary {
  return {
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    tagline: row.tagline,
    priceCents: row.price_cents,
    stock: row.stock,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    image: `/images/products/${row.slug}.webp`,
    imageAlt: row.image_alt,
  }
}

export function listProducts(filter: { category?: string; featured?: boolean } = {}): ProductSummary[] {
  const where: string[] = []
  const params: Array<string | number> = []
  if (filter.category) {
    where.push('p.category_slug = ?')
    params.push(filter.category)
  }
  if (filter.featured) where.push('p.featured = 1')
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const rows = getDb()
    .prepare(`SELECT ${PRODUCT_COLUMNS} ${FROM_PRODUCTS} ${clause} ORDER BY c.position, p.rowid`)
    .all(...params) as unknown as ProductRow[]
  return rows.map(toSummary)
}

export function getProduct(slug: string): Product | undefined {
  const row = getDb()
    .prepare(`SELECT ${PRODUCT_COLUMNS} ${FROM_PRODUCTS} WHERE p.slug = ?`)
    .get(slug) as unknown as ProductRow | undefined
  if (!row) return undefined
  return {
    ...toSummary(row),
    description: row.description,
    specs: JSON.parse(row.specs),
    updatedAt: row.updated_at,
  }
}

export function listCategories(): Category[] {
  const rows = getDb()
    .prepare(`
      SELECT c.slug, c.name, c.description, COUNT(p.slug) AS product_count
      FROM categories c LEFT JOIN products p ON p.category_slug = c.slug
      GROUP BY c.slug ORDER BY c.position`)
    .all() as unknown as Array<{ slug: string; name: string; description: string; product_count: number }>
  return rows.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    productCount: c.product_count,
  }))
}

export function getSitemapEntries() {
  return getDb().prepare('SELECT slug, updated_at FROM products ORDER BY rowid').all() as unknown as Array<{
    slug: string
    updated_at: string
  }>
}
