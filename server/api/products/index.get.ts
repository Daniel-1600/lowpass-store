export default defineEventHandler((event) => {
  const { category, featured } = getQuery(event)
  return listProducts({
    category: typeof category === 'string' ? category : undefined,
    featured: featured === 'true',
  })
})
