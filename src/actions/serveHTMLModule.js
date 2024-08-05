import {getContentTypeHeader} from '../utils/getContentTypeHeader.js';
import {rewriteBareModuleIdentifiers, insert} from '../utils/rewriteBareModuleIdentifiers.js';

const r = /<script\s+?type\s*=\s*["']module["']\s*?>(.+?)<\/script>/gus;
export default async function serveHTMLModule(c) {
  try {
    let code = new TextDecoder().decode(c.var.entry.content);

    for (const m of Array.from(code.matchAll(r)).reverse()) {
      code = insert(code, m.index + m[0].indexOf(m[1]), rewriteBareModuleIdentifiers(m[1], {}), m[1].length)
    }

    return new Response(code, {
      headers: {
        'Content-Length': code.length,
        'Content-Type': getContentTypeHeader(c.var.entry.contentType),
        'Cache-Control': 'public, max-age=31536000', // 1 year
        'Surrogate-Key': 'file, html-file, html-module'
      }
    });
  } catch (error) {
    console.error(error);

    const errorName = error.constructor.name;
    const errorMessage = error.message.replace(
      /^.*?\/unpkg-.+?\//,
      `/${c.req.packageSpec}/`
    );
    const codeFrame = error.codeFrame;
    const debugInfo = `${errorName}: ${errorMessage}\n\n${codeFrame}`;

    return c.text(`Cannot generate module for ${c.req.packageSpec}${c.req.filename}\n\n${debugInfo}`, 500);
  }
}
