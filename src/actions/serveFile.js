import {getContentTypeHeader} from '../utils/getContentTypeHeader.js';
import { etag } from './etag.js';

function extname(path) {
  return path.split('.').pop();
}
export function serveFile(c) {
  const tags = ['file'];

  const ext = extname(c.req.entry.path).substr(1);
  if (ext) {
    tags.push(`${ext}-file`);
  }

  return new Response(c.req.entry.content, {
    headers: {
      'Content-Type': getContentTypeHeader(c.req.entry.contentType),
      'Content-Length': c.req.entry.size,
      'Cache-Control': 'public, max-age=31536000', // 1 year
      'Last-Modified': c.req.entry.lastModified,
      ETag: etag(c.req.entry.content),
      'Surrogate-Key': tags.join(', ')
    }
  });
}
