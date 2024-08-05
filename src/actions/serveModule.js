import serveHTMLModule from './serveHTMLModule.js';
import serveJavaScriptModule from './serveJavaScriptModule.js';

export async function serveModule(c) {
  if (c.var.entry.contentType === 'application/javascript') {
    return serveJavaScriptModule(c);
  }

  if (c.var.entry.contentType === 'text/html') {
    return serveHTMLModule(c);
  }

  return c.text('module mode is available only for JavaScript and HTML files', 403);
}
