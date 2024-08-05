import { parsePackagePathname } from '../utils/parsePackagePathname.js';

/**
 * Parse the pathname in the URL. Reject invalid URLs.
 */
export async function validatePackagePathname(c, next) {
  const url = new URL(c.req.url)
  let path = url.pathname
  if (c.get("browse")) {
    path = path.slice('/browse'.length)
  }
  const parsed = parsePackagePathname(path);

  if (parsed == null) {
    return c.json({ error: `Invalid URL: ${path}` }, 403);
  }

  c.set("packageName", parsed.packageName);
  c.set("packageVersion", parsed.packageVersion);
  c.set("packageSpec", parsed.packageSpec);
  c.set("filename", parsed.filename);

  await next();
}
