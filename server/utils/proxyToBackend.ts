import type { H3Event } from 'h3'

/** Forwards a request to the Python backend (`backend/`), keeping its path and query. */
export function proxyToBackend(event: H3Event) {
  const { apiBase } = useRuntimeConfig(event)
  return proxyRequest(event, new URL(event.path, apiBase).href)
}
