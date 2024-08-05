import { etag } from './etag.js';

import { getContentTypeHeader } from '../utils/getContentTypeHeader.js';
import { rewriteBareModuleIdentifiers } from '../utils/rewriteBareModuleIdentifiers.js';

export default async function serveJavaScriptModule(c) {
  try {
    const code = await rewriteBareModuleIdentifiers(
      new TextDecoder().decode(c.var.entry.content),
      c.var.packageConfig
    );

    return new Response(code, {
      headers: {
        'Content-Length': code.length,
        'Content-Type': getContentTypeHeader(c.var.entry.contentType),
        'Cache-Control': 'public, max-age=31536000', // 1 year
        ETag: await etag(new TextEncoder().encode(code)),
        'Surrogate-Key': 'file, js-file, js-module'
      }
    });
  } catch (error) {
    console.error(error);

    const errorName = error.constructor.name;
    const errorMessage = error.message.replace(
      /^.*?\/unpkg-.+?\//,
      `/${c.var.packageSpec}/`
    );
    const codeFrame = error.codeFrame;
    const debugInfo = `${errorName}: ${errorMessage}\n\n${codeFrame}`;
    return c.text(`Cannot generate module for ${c.var.packageSpec}${c.var.filename}\n\n${debugInfo}`, 500);
  }
}
