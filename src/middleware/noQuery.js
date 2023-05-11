/**
 * Strips all query params from the URL to increase cache hit rates.
 */
export function noQuery() {
  return async (c, next) => {
    const url = new URL(c.req.url);

    if (url.search.length) {
      return c.redirect(url.pathname, 302);
    }

    await next();
  };
}
