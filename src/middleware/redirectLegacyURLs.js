/**
 * Redirect old URLs that we no longer support.
 */
export async function redirectLegacyURLs(c, next) {
  const url = new URL(c.req.url);
  // Permanently redirect /_meta/path to /path?meta
  if (url.pathname.match(/^\/_meta\//)) {
    url.searchParams.set('meta', '');
    url.searchParams.sort();
    return c.redirect(url.pathname.substr(6) + url.search, 301);
  }

  // Permanently redirect /path?json => /path?meta
  if (url.searchParams.has('json')) {
    url.searchParams.delete('json');
    url.searchParams.set('meta', '');
    url.searchParams.sort();
    return c.redirect(url.pathname + url.search, 301);
  }
  await next()
}
