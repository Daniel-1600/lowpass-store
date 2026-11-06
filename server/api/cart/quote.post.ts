export default defineEventHandler(async (event) => {
  const body = await readBody<{ items?: unknown }>(event)
  return buildQuote(parseCartItems(body?.items))
})
