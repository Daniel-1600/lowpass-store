export default defineEventHandler((event) => {
  const product = getProduct(getRouterParam(event, 'slug') ?? '')
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  return product
})
