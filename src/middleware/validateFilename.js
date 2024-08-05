import { createPackageURL } from '../utils/createPackageURL.js';

function filenameRedirect(c) {
  let filename;

  if (c.req.query('module') != null) {
    // See https://github.com/rollup/rollup/wiki/pkg.module
    filename = c.var.packageConfig.module || c.var.packageConfig['jsnext:main'];

    if (!filename) {
      // https://nodejs.org/api/esm.html#esm_code_package_json_code_code_type_code_field
      if (c.var.packageConfig.type === 'module') {
        // Use whatever is in pkg.main or index.js
        filename = c.var.packageConfig.main || '/index.js';
      } else if (
        c.var.packageConfig.main &&
        /\.mjs$/.test(c.var.packageConfig.main)
      ) {
        // Use .mjs file in pkg.main
        filename = c.var.packageConfig.main;
      }
    }

    if (!filename) {
      return c.text(`Package ${c.req.packageSpec} does not contain an ES module`, 404);
    }
  } else if (
    c.req.query('main') &&
    c.var.packageConfig[c.req.query('main')] &&
    typeof c.var.packageConfig[c.req.query('main')] === 'string'
  ) {
    // Deprecated, see #63
    filename = c.var.packageConfig[c.req.query('main')];
  } else if (
    c.var.packageConfig.unpkg &&
    typeof c.var.packageConfig.unpkg === 'string'
  ) {
    filename = c.var.packageConfig.unpkg;
  } else if (
    c.var.packageConfig.browser &&
    typeof c.var.packageConfig.browser === 'string'
  ) {
    // Deprecated, see #63
    filename = c.var.packageConfig.browser;
  } else {
    filename = c.var.packageConfig.main || '/index.js';
  }

  // Redirect to the exact filename so relative imports
  // and URLs resolve correctly.
  return new Response('', {
    headers: {
      Location: createPackageURL(
        c.var.packageName,
        c.var.packageVersion,
        filename.replace(/^[./]*/, '/'),
        new URL(c.req.url).search
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
  if (!c.var.filename) {
    return filenameRedirect(c);
  }

  await next();
}
