/** A backend failure, as opposed to something that doesn't exist. Not cached or indexed as a 404. */
export const catalogueOutage = () =>
  createError({ statusCode: 503, statusMessage: 'Catalogue unavailable', fatal: true })
