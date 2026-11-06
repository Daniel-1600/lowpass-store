import type { CartItem } from '~~/types/store'

const STORAGE_KEY = 'lowpass-cart'

function readStoredCart(): CartItem[] {
  try {
    return normalizeCart(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
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
    persist() // Saves any clean-up, such as combined duplicates.
    // Fires only for changes made in other tabs. `load` runs once, so this is added once.
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY || event.key === null) items.value = readStoredCart()
    })
  }

  function setQuantity(slug: string, quantity: number) {
    if (!Number.isSafeInteger(quantity)) return
    items.value =
      quantity > 0
        ? items.value.map((i) => (i.slug === slug ? { ...i, quantity } : i))
        : items.value.filter((i) => i.slug !== slug)
    persist()
  }

  /** Returns false if the cart has no room for another product. */
  function add(slug: string, quantity = 1, max = Number.POSITIVE_INFINITY) {
    const existing = items.value.find((i) => i.slug === slug)
    if (existing) {
      setQuantity(slug, Math.min(existing.quantity + quantity, max))
      return true
    }
    if (items.value.length >= MAX_CART_LINES) return false
    items.value = [...items.value, { slug, quantity: Math.min(quantity, max) }]
    persist()
    return true
  }

  function clear() {
    items.value = []
    persist()
  }

  return { items, ready, count, load, add, setQuantity, clear }
}
