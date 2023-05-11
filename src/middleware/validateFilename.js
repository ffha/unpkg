import { createPackageURL } from '../utils/createPackageURL.js';

function filenameRedirect(c) {
  let filename;

  if (c.req.query('module') != null) {
    // See https://github.com/rollup/rollup/wiki/pkg.module
    filename = c.req.packageConfig.module || c.req.packageConfig['jsnext:main'];

    if (!filename) {
      // https://nodejs.org/api/esm.html#esm_code_package_json_code_code_type_code_field
      if (c.req.packageConfig.type === 'module') {
        // Use whatever is in pkg.main or index.js
        filename = c.req.packageConfig.main || '/index.js';
      } else if (
        c.req.packageConfig.main &&
        /\.mjs$/.test(c.req.packageConfig.main)
      ) {
        // Use .mjs file in pkg.main
        filename = c.req.packageConfig.main;
      }
    }

    if (!filename) {
      return c.text(`Package ${c.req.packageSpec} does not contain an ES module`, 404);
    }
  } else if (
    c.req.query('main') &&
    c.req.packageConfig[c.req.query('main')] &&
    typeof c.req.packageConfig[c.req.query('main')] === 'string'
  ) {
    // Deprecated, see #63
    filename = c.req.packageConfig[c.req.query('main')];
  } else if (
    c.req.packageConfig.unpkg &&
    typeof c.req.packageConfig.unpkg === 'string'
  ) {
    filename = c.req.packageConfig.unpkg;
  } else if (
    c.req.packageConfig.browser &&
    typeof c.req.packageConfig.browser === 'string'
  ) {
    // Deprecated, see #63
    filename = c.req.packageConfig.browser;
  } else {
    filename = c.req.packageConfig.main || '/index.js';
  }

  // Redirect to the exact filename so relative imports
  // and URLs resolve correctly.
  return new Response('', {
    headers: {
      Location: createPackageURL(
        c.req.packageName,
        c.req.packageVersion,
        filename.replace(/^[./]*/, '/'),
        new URL(c.req.url).searchParams
      ),
      'Cache-Control': 'public, max-age=31536000', // 1 year
      'Surrogate-Key': 'redirect, filename-redirect'
    },
    status: 302
  });
}

/**
 * Redirect to the exact filename if the request omits one.
 */
export async function validateFilename(c, next) {
  if (!c.req.filename) {
    return filenameRedirect(c);
  }

  await next();
}
