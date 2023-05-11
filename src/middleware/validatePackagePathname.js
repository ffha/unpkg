import { parsePackagePathname } from '../utils/parsePackagePathname.js';

/**
 * Parse the pathname in the URL. Reject invalid URLs.
 */
export async function validatePackagePathname(c, next) {
  const url = new URL(c.req.url)
  let path = url.pathname
  if (c.req.browse) {
    path = path.slice('/browse'.length)
  }
  const parsed = parsePackagePathname(path);

  if (parsed == null) {
    return c.json({ error: `Invalid URL: ${path}` }, 403);
  }

  c.req.packageName = parsed.packageName;
  c.req.packageVersion = parsed.packageVersion;
  c.req.packageSpec = parsed.packageSpec;
  c.req.filename = parsed.filename;

  await next();
}
