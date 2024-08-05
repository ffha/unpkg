import {getContentTypeHeader} from '../utils/getContentTypeHeader.js';

function extname(path) {
  return path.split('.').pop();
}
export async function serveFile(c) {
  const tags = ['file'];

  const ext = extname(c.var.entry.path).substr(1);
  if (ext) {
    tags.push(`${ext}-file`);
  }

  return new Response(c.var.entry.content, {
    headers: {
      'Content-Type': getContentTypeHeader(c.var.entry.contentType),
      'Content-Length': c.var.entry.size,
      'Cache-Control': 'public, max-age=31536000', // 1 year
      'Last-Modified': c.var.entry.lastModified,
      'Surrogate-Key': tags.join(', ')
    }
  });
}
