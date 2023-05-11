/**
 * Reject URLs with invalid query parameters to increase cache hit rates.
 */
export function allowQuery(validKeys = []) {
  if (!Array.isArray(validKeys)) {
    validKeys = [validKeys];
  }

  return async (c, next) => {
    const url = new URL(c.req.url);
    let redirect = false;
    for (const key of url.searchParams.keys()) {
      if (!validKeys.includes(key)) {
        redirect = true;
        url.searchParams.delete(key);
      }
    }
    if (redirect) {
      return c.redirect(url);
    }

    await next();
  };
}
