import type { CartItem } from '~~/types/store'

const STORAGE_KEY = 'lowpass-cart'

function readStoredCart(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter((i) => typeof i?.slug === 'string' && Number.isInteger(i?.quantity) && i.quantity > 0)
      : []
  } catch {
    return []
  }
}

/**
 * The cart only stores slugs and quantities; prices always come from the server.
 * `ready` stays false until localStorage has been read, so server-rendered pages
 * and the first client render match and never hydrate differently.
 */
export function useCart() {
  const items = useState<CartItem[]>('cart-items', () => [])
  const ready = useState('cart-ready', () => false)

  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    } catch {
      // Private browsing or full storage: the cart still works until the tab closes.
    }
  }

  function load() {
    if (ready.value) return
    items.value = readStoredCart()
    ready.value = true
  }

  function setQuantity(slug: string, quantity: number) {
    items.value = quantity > 0
      ? items.value.map((i) => (i.slug === slug ? { ...i, quantity } : i))
      : items.value.filter((i) => i.slug !== slug)
    persist()
  }

  function add(slug: string, quantity = 1, max = Number.POSITIVE_INFINITY) {
    const existing = items.value.find((i) => i.slug === slug)
    if (existing) {
      setQuantity(slug, Math.min(existing.quantity + quantity, max))
    } else {
      items.value = [...items.value, { slug, quantity: Math.min(quantity, max) }]
      persist()
    }
  }

  function clear() {
    items.value = []
    persist()
  }

  return { items, ready, count, load, add, setQuantity, clear }
}
