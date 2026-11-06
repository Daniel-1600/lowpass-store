export interface Category {
  slug: string
  name: string
  description: string
  productCount: number
}

export interface ProductSummary {
  slug: string
  sku: string
  name: string
  tagline: string
  priceCents: number
  stock: number
  categorySlug: string
  categoryName: string
  image: string
  imageAlt: string
}

export interface Product extends ProductSummary {
  description: string
  specs: Record<string, string>
  updatedAt: string
}

export interface CartItem {
  slug: string
  quantity: number
}

export interface QuoteLine extends ProductSummary {
  quantity: number
  lineTotalCents: number
}

export interface Quote {
  lines: QuoteLine[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
}

export interface OrderConfirmation {
  orderNumber: string
  email: string
  totalCents: number
}
